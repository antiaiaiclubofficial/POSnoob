-- Migration: 20260721170000_journal_entry_lines.sql
-- Description: Create journal_entry_lines table to normalize journal entry lines from JSONB.

-- 1. Create journal_entry_lines table
CREATE TABLE IF NOT EXISTS public.journal_entry_lines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    journal_entry_id TEXT REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    account_code_id UUID REFERENCES public.account_codes(id) ON DELETE RESTRICT,
    debit NUMERIC(12, 2) NOT NULL DEFAULT 0,
    credit NUMERIC(12, 2) NOT NULL DEFAULT 0,
    description TEXT,
    line_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_je_id ON public.journal_entry_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account_id ON public.journal_entry_lines(account_code_id);

-- 2. Enable RLS for journal_entry_lines
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'journal_entry_lines' AND policyname = 'Enable read access for all authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for all authenticated users" ON public.journal_entry_lines FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'journal_entry_lines' AND policyname = 'Enable insert access for all authenticated users'
    ) THEN
        CREATE POLICY "Enable insert access for all authenticated users" ON public.journal_entry_lines FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'journal_entry_lines' AND policyname = 'Enable update access for all authenticated users'
    ) THEN
        CREATE POLICY "Enable update access for all authenticated users" ON public.journal_entry_lines FOR UPDATE TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'journal_entry_lines' AND policyname = 'Enable delete access for all authenticated users'
    ) THEN
        CREATE POLICY "Enable delete access for all authenticated users" ON public.journal_entry_lines FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- 4. Table to log failed parse rows during backfill
CREATE TABLE IF NOT EXISTS public.journal_entry_backfill_errors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    journal_entry_id TEXT NOT NULL,
    raw_lines JSONB,
    error_message TEXT,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Backfill procedure / function
CREATE OR REPLACE FUNCTION public.fn_backfill_journal_entry_lines()
RETURNS TABLE (
    total_processed INT,
    total_inserted INT,
    total_failed INT
) AS $$
DECLARE
    v_je RECORD;
    v_line JSONB;
    v_index INT;
    v_account_id UUID;
    v_debit NUMERIC(12,2);
    v_credit NUMERIC(12,2);
    v_desc TEXT;
    v_proc_count INT := 0;
    v_ins_count INT := 0;
    v_fail_count INT := 0;
BEGIN
    FOR v_je IN SELECT id, lines FROM public.journal_entries WHERE lines IS NOT NULL AND jsonb_typeof(lines) = 'array' LOOP
        v_proc_count := v_proc_count + 1;
        v_index := 1;
        
        BEGIN
            FOR v_line IN SELECT * FROM jsonb_array_elements(v_je.lines) LOOP
                v_account_id := NULL;
                IF (v_line->>'account_code_id') IS NOT NULL AND (v_line->>'account_code_id') ~ '^[0-9a-fA-F-]{36}$' THEN
                    v_account_id := (v_line->>'account_code_id')::UUID;
                ELSIF (v_line->>'accountId') IS NOT NULL AND (v_line->>'accountId') ~ '^[0-9a-fA-F-]{36}$' THEN
                    v_account_id := (v_line->>'accountId')::UUID;
                END IF;

                v_debit := COALESCE((v_line->>'debit')::NUMERIC, 0);
                v_credit := COALESCE((v_line->>'credit')::NUMERIC, 0);
                v_desc := COALESCE(v_line->>'description', '');

                IF v_account_id IS NOT NULL THEN
                    IF EXISTS (SELECT 1 FROM public.account_codes WHERE id = v_account_id) THEN
                        IF NOT EXISTS (
                            SELECT 1 FROM public.journal_entry_lines 
                            WHERE journal_entry_id = v_je.id 
                            AND account_code_id = v_account_id 
                            AND line_order = v_index
                        ) THEN
                            INSERT INTO public.journal_entry_lines (
                                journal_entry_id, account_code_id, debit, credit, description, line_order
                            ) VALUES (
                                v_je.id, v_account_id, v_debit, v_credit, v_desc, v_index
                            );
                            v_ins_count := v_ins_count + 1;
                        END IF;
                    ELSE
                        v_fail_count := v_fail_count + 1;
                        INSERT INTO public.journal_entry_backfill_errors (journal_entry_id, raw_lines, error_message)
                        VALUES (v_je.id, v_line, 'account_code_id does not exist in account_codes');
                    END IF;
                ELSE
                    v_fail_count := v_fail_count + 1;
                    INSERT INTO public.journal_entry_backfill_errors (journal_entry_id, raw_lines, error_message)
                    VALUES (v_je.id, v_line, 'missing or invalid account_code_id UUID format');
                END IF;

                v_index := v_index + 1;
            END LOOP;
        EXCEPTION WHEN OTHERS THEN
            v_fail_count := v_fail_count + 1;
            INSERT INTO public.journal_entry_backfill_errors (journal_entry_id, raw_lines, error_message)
            VALUES (v_je.id, v_je.lines, SQLERRM);
        END;
    END LOOP;

    RETURN QUERY SELECT v_proc_count, v_ins_count, v_fail_count;
END;
$$ LANGUAGE plpgsql;

-- Execute backfill safely
SELECT * FROM public.fn_backfill_journal_entry_lines();

-- 6. Balance Check Trigger Function
CREATE OR REPLACE FUNCTION public.fn_check_journal_entry_balance()
RETURNS TRIGGER AS $$
DECLARE
    v_status TEXT;
    v_total_debit NUMERIC(12,2);
    v_total_credit NUMERIC(12,2);
    v_target_je_id TEXT;
BEGIN
    v_target_je_id := COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);
    
    SELECT status INTO v_status FROM public.journal_entries WHERE id = v_target_je_id;
    
    IF v_status = 'Posted' THEN
        SELECT COALESCE(SUM(debit), 0), COALESCE(SUM(credit), 0)
        INTO v_total_debit, v_total_credit
        FROM public.journal_entry_lines
        WHERE journal_entry_id = v_target_je_id;

        IF v_total_debit <> v_total_credit THEN
            RAISE EXCEPTION 'Journal entry % debit (%) and credit (%) must be equal when status is Posted', 
                v_target_je_id, v_total_debit, v_total_credit;
        END IF;

        UPDATE public.journal_entries 
        SET total_debit = v_total_debit, total_credit = v_total_credit 
        WHERE id = v_target_je_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_journal_entry_balance ON public.journal_entry_lines;
CREATE CONSTRAINT TRIGGER trg_check_journal_entry_balance
AFTER INSERT OR UPDATE OR DELETE ON public.journal_entry_lines
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION public.fn_check_journal_entry_balance();
