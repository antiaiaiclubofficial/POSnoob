-- Rollback for Migration: 20260721171000_account_mapping_rules.sql

DROP FUNCTION IF EXISTS public.fn_seed_default_account_mapping_rules(UUID, UUID);
DROP TABLE IF EXISTS public.account_mapping_rules;
