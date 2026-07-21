-- Rollback for Migration: 20260721172000_auto_posting_journal_entries.sql

DROP TRIGGER IF EXISTS trg_auto_post_sales ON public.sales_transactions;
DROP FUNCTION IF EXISTS public.fn_trg_auto_post_sales();
DROP FUNCTION IF EXISTS public.fn_post_sales_transaction_to_accounting(TEXT, BOOLEAN);
DROP INDEX IF EXISTS idx_journal_entries_source;
ALTER TABLE public.journal_entries DROP COLUMN IF EXISTS source_type;
ALTER TABLE public.journal_entries DROP COLUMN IF EXISTS source_id;
