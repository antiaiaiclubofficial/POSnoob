-- Rollback for Migration: 20260721170000_journal_entry_lines.sql

DROP TRIGGER IF EXISTS trg_check_journal_entry_balance ON public.journal_entry_lines;
DROP FUNCTION IF EXISTS public.fn_check_journal_entry_balance();
DROP FUNCTION IF EXISTS public.fn_backfill_journal_entry_lines();
DROP TABLE IF EXISTS public.journal_entry_backfill_errors;
DROP TABLE IF EXISTS public.journal_entry_lines;
