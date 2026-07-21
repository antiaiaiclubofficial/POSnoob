-- Rollback for Migration: 20260721190000_consolidated_financial_views.sql

DROP FUNCTION IF EXISTS public.get_consolidated_balance_sheet(UUID, DATE, DATE, UUID);
DROP FUNCTION IF EXISTS public.get_consolidated_profit_loss(UUID, DATE, DATE, UUID);
DROP FUNCTION IF EXISTS public.get_consolidated_trial_balance(UUID, DATE, DATE, UUID);
