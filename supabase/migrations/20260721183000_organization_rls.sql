-- Migration: 20260721183000_organization_rls.sql
-- Description: Helper function get_auth_organization_id() and Organization-level RLS policies for accounting tables.

-- 1. Helper function to get authenticated user's organization_id
CREATE OR REPLACE FUNCTION public.get_auth_organization_id()
RETURNS UUID AS $$
DECLARE
    v_org_id UUID;
BEGIN
    SELECT organization_id INTO v_org_id 
    FROM public.profiles 
    WHERE id = auth.uid();
    
    RETURN v_org_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. Organization-level RLS Policies for journal_entries
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'journal_entries' AND policyname = 'Org access for accounting journal entries'
    ) THEN
        CREATE POLICY "Org access for accounting journal entries" ON public.journal_entries
        FOR ALL TO authenticated
        USING (
            store_id IN (SELECT id FROM public.stores WHERE organization_id = public.get_auth_organization_id())
        );
    END IF;
END $$;

-- 3. Organization-level RLS Policies for account_codes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'account_codes' AND policyname = 'Org access for account codes'
    ) THEN
        CREATE POLICY "Org access for account codes" ON public.account_codes
        FOR ALL TO authenticated
        USING (
            organization_id = public.get_auth_organization_id() OR
            store_id IN (SELECT id FROM public.stores WHERE organization_id = public.get_auth_organization_id())
        );
    END IF;
END $$;

-- 4. Organization-level RLS Policies for journal_entry_lines
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'journal_entry_lines' AND policyname = 'Org access for journal entry lines'
    ) THEN
        CREATE POLICY "Org access for journal entry lines" ON public.journal_entry_lines
        FOR ALL TO authenticated
        USING (
            journal_entry_id IN (
                SELECT id FROM public.journal_entries 
                WHERE store_id IN (SELECT id FROM public.stores WHERE organization_id = public.get_auth_organization_id())
            )
        );
    END IF;
END $$;
