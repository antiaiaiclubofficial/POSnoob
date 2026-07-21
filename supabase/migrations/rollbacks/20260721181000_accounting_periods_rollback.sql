-- Rollback for Migration: 20260721181000_accounting_periods.sql

DROP TRIGGER IF EXISTS trg_prevent_closed_period ON public.journal_entries;
DROP FUNCTION IF EXISTS public.fn_prevent_closed_period_modifications();
DROP TABLE IF EXISTS public.accounting_periods;
