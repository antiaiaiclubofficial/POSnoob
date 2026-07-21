-- Rollback for Migration: 20260721183000_organization_rls.sql

DROP POLICY IF EXISTS "Org access for journal entry lines" ON public.journal_entry_lines;
DROP POLICY IF EXISTS "Org access for account codes" ON public.account_codes;
DROP POLICY IF EXISTS "Org access for accounting journal entries" ON public.journal_entries;
DROP FUNCTION IF EXISTS public.get_auth_organization_id();
