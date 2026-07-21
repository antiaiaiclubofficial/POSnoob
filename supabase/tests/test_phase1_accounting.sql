-- Test Script: test_phase1_accounting.sql
-- Description: Test suite for Phase 1 Auto-Posting and Double-Entry Balance Verification.

DO $$
DECLARE
    v_store_id UUID;
    v_sales_id TEXT := 'TEST-SALE-' || gen_random_uuid()::TEXT;
    v_posted_result RECORD;
    v_je_id TEXT;
    v_debit_sum NUMERIC;
    v_credit_sum NUMERIC;
BEGIN
    RAISE NOTICE '=== STARTING PHASE 1 ACCOUNTING TEST ===';

    -- 1. Get or create test store
    SELECT id INTO v_store_id FROM public.stores LIMIT 1;
    IF v_store_id IS NULL THEN
        INSERT INTO public.stores (name) VALUES ('Test Store') RETURNING id INTO v_store_id;
    END IF;

    -- Seed default mapping
    PERFORM public.fn_seed_default_account_mapping_rules(v_store_id);

    -- 2. Insert dummy sales transaction
    INSERT INTO public.sales_transactions (
        id, store_id, amount, subtotal, vat_amount, discount_amount, customer_name, payment_method, created_at
    ) VALUES (
        v_sales_id, v_store_id, 1070.00, 1000.00, 70.00, 0.00, 'Test Customer', 'PromptPay', NOW()
    );

    -- 3. Verify Journal Entry was created via auto-post trigger
    SELECT id INTO v_je_id FROM public.journal_entries WHERE source_type = 'sales_transaction' AND source_id = v_sales_id;
    
    IF v_je_id IS NULL THEN
        RAISE EXCEPTION 'TEST FAILED: Journal Entry was NOT created for sales_id %', v_sales_id;
    END IF;
    RAISE NOTICE 'SUCCESS: Journal Entry % created.', v_je_id;

    -- 4. Verify Debit = Credit in journal_entry_lines
    SELECT SUM(debit), SUM(credit) INTO v_debit_sum, v_credit_sum
    FROM public.journal_entry_lines
    WHERE journal_entry_id = v_je_id;

    IF v_debit_sum <> 1070.00 OR v_credit_sum <> 1070.00 OR v_debit_sum <> v_credit_sum THEN
        RAISE EXCEPTION 'TEST FAILED: Debit (%) and Credit (%) do not match expected 1070.00', v_debit_sum, v_credit_sum;
    END IF;
    RAISE NOTICE 'SUCCESS: Double-Entry Balance verified! Debit: %, Credit: %', v_debit_sum, v_credit_sum;

    -- Cleanup test data
    DELETE FROM public.journal_entries WHERE id = v_je_id;
    DELETE FROM public.sales_transactions WHERE id = v_sales_id;

    RAISE NOTICE '=== ALL PHASE 1 TESTS PASSED SUCCESSFULLY! ===';
END;
$$;
