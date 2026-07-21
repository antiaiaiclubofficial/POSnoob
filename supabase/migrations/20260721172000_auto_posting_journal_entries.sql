-- Migration: 20260721172000_auto_posting_journal_entries.sql
-- Description: Implement Auto-Posting logic from Sales Transactions and Billing Documents to Journal Entries.

-- 1. Add source_type and source_id columns to journal_entries for traceability
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS source_type TEXT;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS source_id TEXT;

-- Create unique index to prevent duplicate posting for the same source document
CREATE UNIQUE INDEX IF NOT EXISTS idx_journal_entries_source ON public.journal_entries(source_type, source_id) WHERE source_type IS NOT NULL AND source_id IS NOT NULL;

-- 2. Function to auto-post a sales transaction to double-entry accounting
CREATE OR REPLACE FUNCTION public.fn_post_sales_transaction_to_accounting(
    p_sales_id TEXT,
    p_dry_run BOOLEAN DEFAULT false
)
RETURNS TABLE (
    success BOOLEAN,
    journal_entry_id TEXT,
    status TEXT,
    message TEXT
) AS $$
DECLARE
    v_tx RECORD;
    v_store_id UUID;
    v_cash_account UUID;
    v_bank_account UUID;
    v_payment_account UUID;
    v_revenue_account UUID;
    v_vat_account UUID;
    v_discount_account UUID;
    v_je_id TEXT;
    v_date DATE;
    v_ref_no TEXT;
    v_desc TEXT;
    v_status TEXT := 'Posted';
    v_missing_map TEXT := '';
    v_total NUMERIC(12,2);
    v_subtotal NUMERIC(12,2);
    v_vat NUMERIC(12,2);
    v_discount NUMERIC(12,2);
    v_debit_sum NUMERIC(12,2) := 0;
    v_credit_sum NUMERIC(12,2) := 0;
    v_json_lines JSONB := '[]'::JSONB;
BEGIN
    -- Get sales transaction
    SELECT * INTO v_tx FROM public.sales_transactions WHERE id = p_sales_id;
    IF v_tx IS NULL THEN
        RETURN QUERY SELECT false, NULL::TEXT, 'Error'::TEXT, 'Sales transaction not found'::TEXT;
        RETURN;
    END IF;

    -- Check if already posted
    IF EXISTS (SELECT 1 FROM public.journal_entries WHERE source_type = 'sales_transaction' AND source_id = p_sales_id) THEN
        SELECT id INTO v_je_id FROM public.journal_entries WHERE source_type = 'sales_transaction' AND source_id = p_sales_id;
        RETURN QUERY SELECT true, v_je_id, 'AlreadyPosted'::TEXT, 'Transaction already posted to journal entries'::TEXT;
        RETURN;
    END IF;

    v_store_id := v_tx.store_id;
    v_date := (v_tx.created_at AT TIME ZONE 'UTC')::DATE;
    v_ref_no := COALESCE(v_tx.id, 'POS-SALE');
    v_desc := 'ยอดขาย POS: ' || COALESCE(v_tx.customer_name, 'ลูกค้าทั่วไป');

    v_total := COALESCE(v_tx.amount, 0);
    v_discount := COALESCE(v_tx.discount_amount, 0);
    v_vat := COALESCE(v_tx.vat_amount, 0);
    
    -- Subtotal calculation fix: handle 0 or NULL subtotal
    IF v_tx.subtotal IS NOT NULL AND v_tx.subtotal > 0 THEN
        v_subtotal := v_tx.subtotal;
    ELSE
        v_subtotal := v_total - v_vat + v_discount;
    END IF;

    -- Find mapped accounts for store
    SELECT account_code_id INTO v_cash_account FROM public.account_mapping_rules WHERE store_id = v_store_id AND transaction_type = 'cash_on_hand' AND is_active = true LIMIT 1;
    SELECT account_code_id INTO v_bank_account FROM public.account_mapping_rules WHERE store_id = v_store_id AND transaction_type = 'bank_transfer' AND is_active = true LIMIT 1;
    SELECT account_code_id INTO v_revenue_account FROM public.account_mapping_rules WHERE store_id = v_store_id AND transaction_type IN ('sale_product', 'sale_service') AND is_active = true LIMIT 1;
    SELECT account_code_id INTO v_vat_account FROM public.account_mapping_rules WHERE store_id = v_store_id AND transaction_type = 'vat_output' AND is_active = true LIMIT 1;
    SELECT account_code_id INTO v_discount_account FROM public.account_mapping_rules WHERE store_id = v_store_id AND transaction_type = 'discount' AND is_active = true LIMIT 1;

    -- Fallback lookup if not mapped
    IF v_cash_account IS NULL THEN
        SELECT id INTO v_cash_account FROM public.account_codes WHERE (store_id = v_store_id OR store_id IS NULL) AND category = 'Assets' ORDER BY code ASC LIMIT 1;
    END IF;
    IF v_bank_account IS NULL THEN
        v_bank_account := v_cash_account;
    END IF;
    IF v_revenue_account IS NULL THEN
        SELECT id INTO v_revenue_account FROM public.account_codes WHERE (store_id = v_store_id OR store_id IS NULL) AND category = 'Revenue' ORDER BY code ASC LIMIT 1;
    END IF;

    -- Select payment account based on payment_method
    IF LOWER(COALESCE(v_tx.payment_method, 'cash')) LIKE '%cash%' THEN
        v_payment_account := v_cash_account;
    ELSE
        v_payment_account := v_bank_account;
    END IF;

    -- Validate mappings
    IF v_payment_account IS NULL THEN
        v_status := 'Draft';
        v_missing_map := v_missing_map || '[Payment Account Missing] ';
    END IF;
    IF v_revenue_account IS NULL THEN
        v_status := 'Draft';
        v_missing_map := v_missing_map || '[Revenue Account Missing] ';
    END IF;

    v_je_id := 'JE-SJ-' || TO_CHAR(v_date, 'YYYYMMDD') || '-' || SUBSTRING(p_sales_id FROM 1 FOR 6);

    IF p_dry_run THEN
        RETURN QUERY SELECT true, v_je_id, v_status, 'Dry-run preview success. Status: ' || v_status || ' Warnings: ' || v_missing_map;
        RETURN;
    END IF;

    -- Prepare lines json for backwards compatibility
    v_json_lines := jsonb_build_array(
        jsonb_build_object('accountId', v_payment_account, 'debit', v_total, 'credit', 0, 'description', 'รับชำระเงินค่าสินค้า/บริการ'),
        jsonb_build_object('accountId', v_revenue_account, 'debit', 0, 'credit', v_subtotal, 'description', 'รายได้ขาย')
    );

    IF v_vat > 0 AND v_vat_account IS NOT NULL THEN
        v_json_lines := v_json_lines || jsonb_build_object('accountId', v_vat_account, 'debit', 0, 'credit', v_vat, 'description', 'ภาษีขาย 7%');
    END IF;

    -- Insert into journal_entries
    INSERT INTO public.journal_entries (
        id, store_id, date, journal_type, reference_no, description, lines, status,
        total_debit, total_credit, source_type, source_id, created_at
    ) VALUES (
        v_je_id, v_store_id, v_date, 'SJ', v_ref_no, v_desc, v_json_lines, v_status,
        v_total, v_total, 'sales_transaction', p_sales_id, NOW()
    );

    -- Insert into journal_entry_lines if payment and revenue accounts exist
    IF v_payment_account IS NOT NULL THEN
        INSERT INTO public.journal_entry_lines (journal_entry_id, account_code_id, debit, credit, description, line_order)
        VALUES (v_je_id, v_payment_account, v_total, 0, 'รับชำระเงินค่าสินค้า/บริการ', 1);
    END IF;

    IF v_revenue_account IS NOT NULL THEN
        INSERT INTO public.journal_entry_lines (journal_entry_id, account_code_id, debit, credit, description, line_order)
        VALUES (v_je_id, v_revenue_account, 0, v_subtotal, 'รายได้ขาย', 2);
    END IF;

    IF v_vat > 0 AND v_vat_account IS NOT NULL THEN
        INSERT INTO public.journal_entry_lines (journal_entry_id, account_code_id, debit, credit, description, line_order)
        VALUES (v_je_id, v_vat_account, 0, v_vat, 'ภาษีขาย 7%', 3);
    END IF;

    RETURN QUERY SELECT true, v_je_id, v_status, 'Successfully auto-posted. Status: ' || v_status || ' Warnings: ' || v_missing_map;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger Function on sales_transactions
CREATE OR REPLACE FUNCTION public.fn_trg_auto_post_sales()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.fn_post_sales_transaction_to_accounting(NEW.id, false);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_post_sales ON public.sales_transactions;
CREATE TRIGGER trg_auto_post_sales
AFTER INSERT ON public.sales_transactions
FOR EACH ROW EXECUTE FUNCTION public.fn_trg_auto_post_sales();
