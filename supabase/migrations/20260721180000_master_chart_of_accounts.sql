-- Migration: 20260721180000_master_chart_of_accounts.sql
-- Description: Add organization_id to account_codes and allow shared organization-level chart of accounts.

-- 1. Add organization_id column to account_codes and make store_id nullable
ALTER TABLE public.account_codes ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.account_codes ALTER COLUMN store_id DROP NOT NULL;

-- Index for lookup
CREATE INDEX IF NOT EXISTS idx_account_codes_org ON public.account_codes(organization_id);

-- 2. Backfill organization_id for existing store account codes
UPDATE public.account_codes ac
SET organization_id = s.organization_id
FROM public.stores s
WHERE ac.store_id = s.id AND ac.organization_id IS NULL;

-- 3. Function to promote common account codes across branches to org-level
CREATE OR REPLACE FUNCTION public.fn_promote_common_account_codes_to_org(
    p_dry_run BOOLEAN DEFAULT true
)
RETURNS TABLE (
    code TEXT,
    name TEXT,
    action TEXT,
    affected_stores INT
) AS $$
DECLARE
    v_rec RECORD;
BEGIN
    FOR v_rec IN 
        SELECT ac.code, ac.name, ac.organization_id, COUNT(DISTINCT ac.store_id) as store_count
        FROM public.account_codes ac
        WHERE ac.store_id IS NOT NULL AND ac.organization_id IS NOT NULL
        GROUP BY ac.code, ac.name, ac.organization_id
        HAVING COUNT(DISTINCT ac.store_id) > 1
    LOOP
        code := v_rec.code;
        name := v_rec.name;
        affected_stores := v_rec.store_count;

        IF p_dry_run THEN
            action := 'DRY-RUN: Would merge ' || v_rec.store_count || ' store-level accounts to 1 Org-level account';
        ELSE
            -- Promote the first account to org-level (store_id = NULL)
            UPDATE public.account_codes 
            SET store_id = NULL 
            WHERE id = (
                SELECT id FROM public.account_codes 
                WHERE code = v_rec.code AND organization_id = v_rec.organization_id AND store_id IS NOT NULL 
                LIMIT 1
            );
            
            action := 'PROMOTED to Organization level';
        END IF;

        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
