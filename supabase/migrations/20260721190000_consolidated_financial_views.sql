-- Migration: 20260721190000_consolidated_financial_views.sql
-- Description: Create consolidated financial report functions for Trial Balance, Profit & Loss, and Balance Sheet.

-- 1. Consolidated Trial Balance Function
CREATE OR REPLACE FUNCTION public.get_consolidated_trial_balance(
    p_org_id UUID DEFAULT NULL,
    p_start_date DATE DEFAULT '2000-01-01',
    p_end_date DATE DEFAULT '2099-12-31',
    p_store_id UUID DEFAULT NULL
)
RETURNS TABLE (
    account_code_id UUID,
    account_code TEXT,
    account_name TEXT,
    category TEXT,
    total_debit NUMERIC(12,2),
    total_credit NUMERIC(12,2),
    net_balance NUMERIC(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ac.id AS account_code_id,
        ac.code AS account_code,
        ac.name AS account_name,
        ac.category,
        COALESCE(SUM(jel.debit), 0)::NUMERIC(12,2) AS total_debit,
        COALESCE(SUM(jel.credit), 0)::NUMERIC(12,2) AS total_credit,
        (
            CASE 
                WHEN ac.category IN ('Assets', 'Expenses') THEN COALESCE(SUM(jel.debit - jel.credit), 0)
                ELSE COALESCE(SUM(jel.credit - jel.debit), 0)
            END
        )::NUMERIC(12,2) AS net_balance
    FROM public.account_codes ac
    LEFT JOIN public.journal_entry_lines jel ON jel.account_code_id = ac.id
    LEFT JOIN public.journal_entries je ON je.id = jel.journal_entry_id
    WHERE je.status = 'Posted'
      AND (p_org_id IS NULL OR ac.organization_id = p_org_id OR je.store_id IN (SELECT id FROM public.stores WHERE organization_id = p_org_id))
      AND (p_store_id IS NULL OR je.store_id = p_store_id)
      AND je.date BETWEEN p_start_date AND p_end_date
    GROUP BY ac.id, ac.code, ac.name, ac.category
    ORDER BY ac.code ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Consolidated Profit & Loss Function
CREATE OR REPLACE FUNCTION public.get_consolidated_profit_loss(
    p_org_id UUID DEFAULT NULL,
    p_start_date DATE DEFAULT '2000-01-01',
    p_end_date DATE DEFAULT '2099-12-31',
    p_store_id UUID DEFAULT NULL
)
RETURNS TABLE (
    total_revenue NUMERIC(12,2),
    total_expenses NUMERIC(12,2),
    net_profit NUMERIC(12,2)
) AS $$
DECLARE
    v_rev NUMERIC(12,2) := 0;
    v_exp NUMERIC(12,2) := 0;
BEGIN
    -- Revenue = SUM(credit - debit) for category Revenue
    SELECT COALESCE(SUM(jel.credit - jel.debit), 0) INTO v_rev
    FROM public.journal_entry_lines jel
    JOIN public.account_codes ac ON ac.id = jel.account_code_id
    JOIN public.journal_entries je ON je.id = jel.journal_entry_id
    WHERE je.status = 'Posted'
      AND ac.category = 'Revenue'
      AND (p_org_id IS NULL OR ac.organization_id = p_org_id OR je.store_id IN (SELECT id FROM public.stores WHERE organization_id = p_org_id))
      AND (p_store_id IS NULL OR je.store_id = p_store_id)
      AND je.date BETWEEN p_start_date AND p_end_date;

    -- Expenses = SUM(debit - credit) for category Expenses
    SELECT COALESCE(SUM(jel.debit - jel.credit), 0) INTO v_exp
    FROM public.journal_entry_lines jel
    JOIN public.account_codes ac ON ac.id = jel.account_code_id
    JOIN public.journal_entries je ON je.id = jel.journal_entry_id
    WHERE je.status = 'Posted'
      AND ac.category = 'Expenses'
      AND (p_org_id IS NULL OR ac.organization_id = p_org_id OR je.store_id IN (SELECT id FROM public.stores WHERE organization_id = p_org_id))
      AND (p_store_id IS NULL OR je.store_id = p_store_id)
      AND je.date BETWEEN p_start_date AND p_end_date;

    RETURN QUERY SELECT v_rev, v_exp, (v_rev - v_exp)::NUMERIC(12,2);
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Consolidated Balance Sheet Function
CREATE OR REPLACE FUNCTION public.get_consolidated_balance_sheet(
    p_org_id UUID DEFAULT NULL,
    p_start_date DATE DEFAULT '2000-01-01',
    p_end_date DATE DEFAULT '2099-12-31',
    p_store_id UUID DEFAULT NULL
)
RETURNS TABLE (
    total_assets NUMERIC(12,2),
    total_liabilities NUMERIC(12,2),
    total_equity NUMERIC(12,2),
    is_balanced BOOLEAN
) AS $$
DECLARE
    v_assets NUMERIC(12,2) := 0;
    v_liab NUMERIC(12,2) := 0;
    v_eq NUMERIC(12,2) := 0;
BEGIN
    SELECT COALESCE(SUM(jel.debit - jel.credit), 0) INTO v_assets
    FROM public.journal_entry_lines jel
    JOIN public.account_codes ac ON ac.id = jel.account_code_id
    JOIN public.journal_entries je ON je.id = jel.journal_entry_id
    WHERE je.status = 'Posted' AND ac.category = 'Assets'
      AND (p_org_id IS NULL OR ac.organization_id = p_org_id OR je.store_id IN (SELECT id FROM public.stores WHERE organization_id = p_org_id))
      AND (p_store_id IS NULL OR je.store_id = p_store_id)
      AND je.date BETWEEN p_start_date AND p_end_date;

    SELECT COALESCE(SUM(jel.credit - jel.debit), 0) INTO v_liab
    FROM public.journal_entry_lines jel
    JOIN public.account_codes ac ON ac.id = jel.account_code_id
    JOIN public.journal_entries je ON je.id = jel.journal_entry_id
    WHERE je.status = 'Posted' AND ac.category = 'Liabilities'
      AND (p_org_id IS NULL OR ac.organization_id = p_org_id OR je.store_id IN (SELECT id FROM public.stores WHERE organization_id = p_org_id))
      AND (p_store_id IS NULL OR je.store_id = p_store_id)
      AND je.date BETWEEN p_start_date AND p_end_date;

    SELECT COALESCE(SUM(jel.credit - jel.debit), 0) INTO v_eq
    FROM public.journal_entry_lines jel
    JOIN public.account_codes ac ON ac.id = jel.account_code_id
    JOIN public.journal_entries je ON je.id = jel.journal_entry_id
    WHERE je.status = 'Posted' AND ac.category = 'Equity'
      AND (p_org_id IS NULL OR ac.organization_id = p_org_id OR je.store_id IN (SELECT id FROM public.stores WHERE organization_id = p_org_id))
      AND (p_store_id IS NULL OR je.store_id = p_store_id)
      AND je.date BETWEEN p_start_date AND p_end_date;

    RETURN QUERY SELECT v_assets, v_liab, v_eq, (v_assets = (v_liab + v_eq));
END;
$$ LANGUAGE plpgsql STABLE;
