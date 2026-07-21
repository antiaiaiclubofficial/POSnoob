-- Migration: 20260721181000_accounting_periods.sql
-- Description: Create accounting_periods table and lock trigger on journal entries.

-- 1. Create accounting_periods table
CREATE TABLE IF NOT EXISTS public.accounting_periods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    period_name TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('open', 'closed', 'locked')) DEFAULT 'open',
    closed_by TEXT,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_period_dates CHECK (period_end >= period_start)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_accounting_periods_org ON public.accounting_periods(organization_id);
CREATE INDEX IF NOT EXISTS idx_accounting_periods_dates ON public.accounting_periods(period_start, period_end);

-- 2. Enable RLS
ALTER TABLE public.accounting_periods ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'accounting_periods' AND policyname = 'Enable read access for all authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for all authenticated users" ON public.accounting_periods FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'accounting_periods' AND policyname = 'Enable insert access for all authenticated users'
    ) THEN
        CREATE POLICY "Enable insert access for all authenticated users" ON public.accounting_periods FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'accounting_periods' AND policyname = 'Enable update access for all authenticated users'
    ) THEN
        CREATE POLICY "Enable update access for all authenticated users" ON public.accounting_periods FOR UPDATE TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'accounting_periods' AND policyname = 'Enable delete access for all authenticated users'
    ) THEN
        CREATE POLICY "Enable delete access for all authenticated users" ON public.accounting_periods FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- 4. Period Lock Trigger on journal_entries
CREATE OR REPLACE FUNCTION public.fn_prevent_closed_period_modifications()
RETURNS TRIGGER AS $$
DECLARE
    v_entry_date DATE;
    v_store_id UUID;
    v_period_status TEXT;
    v_user_role TEXT;
BEGIN
    v_entry_date := COALESCE(NEW.date, OLD.date);
    v_store_id := COALESCE(NEW.store_id, OLD.store_id);

    -- Check if date falls in closed or locked period
    SELECT status INTO v_period_status
    FROM public.accounting_periods
    WHERE (store_id = v_store_id OR store_id IS NULL)
      AND v_entry_date BETWEEN period_start AND period_end
      AND status IN ('closed', 'locked')
    ORDER BY store_id NULLS LAST
    LIMIT 1;

    IF v_period_status IS NOT NULL THEN
        -- Check current profile role if allowed bypass
        SELECT role INTO v_user_role FROM public.profiles WHERE id = auth.uid();
        
        IF v_user_role IS NULL OR v_user_role NOT IN ('superadmin', 'org_owner', 'accountant_admin') THEN
            RAISE EXCEPTION 'Cannot modify journal entry on date % because accounting period is %', 
                v_entry_date, v_period_status;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_closed_period ON public.journal_entries;
CREATE TRIGGER trg_prevent_closed_period
BEFORE INSERT OR UPDATE OR DELETE ON public.journal_entries
FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_closed_period_modifications();
