-- Backfill Script: backfill_sales_to_journal_entries.sql
-- Description: Run auto-posting for all historical sales_transactions with dry-run support.

CREATE OR REPLACE FUNCTION public.fn_backfill_historical_sales_to_journal_entries(
    p_dry_run BOOLEAN DEFAULT true
)
RETURNS TABLE (
    total_found INT,
    total_posted INT,
    total_skipped INT,
    total_errors INT,
    preview_details JSONB
) AS $$
DECLARE
    v_rec RECORD;
    v_res RECORD;
    v_found INT := 0;
    v_posted INT := 0;
    v_skipped INT := 0;
    v_errors INT := 0;
    v_details JSONB := '[]'::JSONB;
BEGIN
    FOR v_rec IN SELECT id, amount, created_at FROM public.sales_transactions ORDER BY created_at ASC LOOP
        v_found := v_found + 1;
        
        SELECT * INTO v_res FROM public.fn_post_sales_transaction_to_accounting(v_rec.id, p_dry_run);
        
        IF v_res.status = 'AlreadyPosted' THEN
            v_skipped := v_skipped + 1;
        ELSIF v_res.success THEN
            v_posted := v_posted + 1;
            v_details := v_details || jsonb_build_object(
                'sales_id', v_rec.id,
                'journal_id', v_res.journal_entry_id,
                'status', v_res.status,
                'message', v_res.message
            );
        ELSE
            v_errors := v_errors + 1;
            v_details := v_details || jsonb_build_object(
                'sales_id', v_rec.id,
                'error', v_res.message
            );
        END IF;
    END LOOP;

    RETURN QUERY SELECT v_found, v_posted, v_skipped, v_errors, v_details;
END;
$$ LANGUAGE plpgsql;

-- Usage examples:
-- 1. Dry Run (Preview without committing any changes):
-- SELECT * FROM public.fn_backfill_historical_sales_to_journal_entries(true);

-- 2. Actual Run (Commit journal entries to database):
-- SELECT * FROM public.fn_backfill_historical_sales_to_journal_entries(false);
