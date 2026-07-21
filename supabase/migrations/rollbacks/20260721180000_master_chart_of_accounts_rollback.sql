-- Rollback for Migration: 20260721180000_master_chart_of_accounts.sql

DROP FUNCTION IF EXISTS public.fn_promote_common_account_codes_to_org(BOOLEAN);
DROP INDEX IF EXISTS idx_account_codes_org;
ALTER TABLE public.account_codes DROP COLUMN IF EXISTS organization_id;
