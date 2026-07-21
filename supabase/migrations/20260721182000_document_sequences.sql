-- Migration: 20260721182000_document_sequences.sql
-- Description: Create document_counters table and sequence generator per branch.

-- 1. Create document_counters table
CREATE TABLE IF NOT EXISTS public.document_counters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL,
    prefix TEXT NOT NULL,
    year_month TEXT NOT NULL, -- Format YYYYMM (e.g. 202607)
    last_number INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_store_doc_ym UNIQUE (store_id, doc_type, year_month)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_document_counters ON public.document_counters(store_id, doc_type, year_month);

-- 2. Function to generate atomic document_no per store and document type
CREATE OR REPLACE FUNCTION public.fn_generate_document_no(
    p_store_id UUID,
    p_doc_type TEXT,
    p_prefix TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_prefix TEXT;
    v_ym TEXT;
    v_next_num INT;
    v_doc_no TEXT;
BEGIN
    v_ym := TO_CHAR(CURRENT_DATE, 'YYYYMM');
    
    -- Default prefixes
    IF p_prefix IS NULL THEN
        CASE p_doc_type
            WHEN 'journal_entry' THEN v_prefix := 'JE';
            WHEN 'billing_document' THEN v_prefix := 'INV';
            WHEN 'purchase_order' THEN v_prefix := 'PO';
            WHEN 'purchase_request' THEN v_prefix := 'PR';
            WHEN 'quotation' THEN v_prefix := 'QT';
            ELSE v_prefix := UPPER(p_doc_type);
        END CASE;
    ELSE
        v_prefix := p_prefix;
    END IF;

    -- Upsert atomic counter using ROW-LEVEL LOCK
    INSERT INTO public.document_counters (store_id, doc_type, prefix, year_month, last_number)
    VALUES (p_store_id, p_doc_type, v_prefix, v_ym, 1)
    ON CONFLICT (store_id, doc_type, year_month)
    DO UPDATE SET last_number = public.document_counters.last_number + 1, updated_at = NOW()
    RETURNING last_number INTO v_next_num;

    -- Format document_no e.g. JE-202607-0001
    v_doc_no := v_prefix || '-' || v_ym || '-' || LPAD(v_next_num::TEXT, 4, '0');
    
    RETURN v_doc_no;
END;
$$ LANGUAGE plpgsql;
