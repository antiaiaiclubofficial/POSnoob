-- Migration: 20260721171000_account_mapping_rules.sql
-- Description: Create account_mapping_rules table to map transaction types to account codes.

-- 1. Create account_mapping_rules table
CREATE TABLE IF NOT EXISTS public.account_mapping_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL,
    account_code_id UUID REFERENCES public.account_codes(id) ON DELETE CASCADE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_store_trans_type UNIQUE (store_id, transaction_type)
);

-- Index for lookup
CREATE INDEX IF NOT EXISTS idx_account_mapping_rules_store ON public.account_mapping_rules(store_id);
CREATE INDEX IF NOT EXISTS idx_account_mapping_rules_org ON public.account_mapping_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_account_mapping_rules_type ON public.account_mapping_rules(transaction_type);

-- 2. Enable RLS
ALTER TABLE public.account_mapping_rules ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'account_mapping_rules' AND policyname = 'Enable read access for all authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for all authenticated users" ON public.account_mapping_rules FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'account_mapping_rules' AND policyname = 'Enable insert access for all authenticated users'
    ) THEN
        CREATE POLICY "Enable insert access for all authenticated users" ON public.account_mapping_rules FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'account_mapping_rules' AND policyname = 'Enable update access for all authenticated users'
    ) THEN
        CREATE POLICY "Enable update access for all authenticated users" ON public.account_mapping_rules FOR UPDATE TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'account_mapping_rules' AND policyname = 'Enable delete access for all authenticated users'
    ) THEN
        CREATE POLICY "Enable delete access for all authenticated users" ON public.account_mapping_rules FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- 4. Helper function to seed default mapping rules for a store
CREATE OR REPLACE FUNCTION public.fn_seed_default_account_mapping_rules(p_store_id UUID, p_org_id UUID DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    v_cash_id UUID;
    v_bank_id UUID;
    v_ar_id UUID;
    v_sale_prod_id UUID;
    v_sale_serv_id UUID;
    v_vat_out_id UUID;
    v_cogs_id UUID;
    v_inv_id UUID;
    v_disc_id UUID;
    v_sc_id UUID;
    v_wht_id UUID;
BEGIN
    -- Find matching account codes by code or name pattern
    SELECT id INTO v_cash_id FROM public.account_codes WHERE store_id = p_store_id AND (code LIKE '11%' OR category = 'Assets') ORDER BY code ASC LIMIT 1;
    SELECT id INTO v_bank_id FROM public.account_codes WHERE store_id = p_store_id AND (code LIKE '12%' OR name LIKE '%ธนาคาร%' OR category = 'Assets') ORDER BY code ASC LIMIT 1;
    SELECT id INTO v_ar_id FROM public.account_codes WHERE store_id = p_store_id AND (code LIKE '13%' OR name LIKE '%ลูกหนี้%' OR category = 'Assets') ORDER BY code ASC LIMIT 1;
    SELECT id INTO v_inv_id FROM public.account_codes WHERE store_id = p_store_id AND (code LIKE '14%' OR name LIKE '%สินค้า%' OR category = 'Assets') ORDER BY code ASC LIMIT 1;

    SELECT id INTO v_sale_prod_id FROM public.account_codes WHERE store_id = p_store_id AND (code LIKE '41%' OR category = 'Revenue') ORDER BY code ASC LIMIT 1;
    SELECT id INTO v_sale_serv_id FROM public.account_codes WHERE store_id = p_store_id AND (code LIKE '42%' OR name LIKE '%บริการ%' OR category = 'Revenue') ORDER BY code ASC LIMIT 1;

    SELECT id INTO v_cogs_id FROM public.account_codes WHERE store_id = p_store_id AND (code LIKE '51%' OR category = 'Expenses') ORDER BY code ASC LIMIT 1;
    SELECT id INTO v_disc_id FROM public.account_codes WHERE store_id = p_store_id AND (code LIKE '52%' OR name LIKE '%ส่วนลด%' OR category = 'Expenses') ORDER BY code ASC LIMIT 1;

    -- Upsert mapping rules
    IF v_cash_id IS NOT NULL THEN
        INSERT INTO public.account_mapping_rules (store_id, organization_id, transaction_type, account_code_id, description)
        VALUES (p_store_id, p_org_id, 'cash_on_hand', v_cash_id, 'เงินสดสด/รับชำระเงินสด')
        ON CONFLICT (store_id, transaction_type) DO NOTHING;
    END IF;

    IF v_bank_id IS NOT NULL THEN
        INSERT INTO public.account_mapping_rules (store_id, organization_id, transaction_type, account_code_id, description)
        VALUES (p_store_id, p_org_id, 'bank_transfer', v_bank_id, 'โอนเงินเข้าธนาคาร/พร้อมเพย์')
        ON CONFLICT (store_id, transaction_type) DO NOTHING;
    END IF;

    IF v_sale_prod_id IS NOT NULL THEN
        INSERT INTO public.account_mapping_rules (store_id, organization_id, transaction_type, account_code_id, description)
        VALUES (p_store_id, p_org_id, 'sale_product', v_sale_prod_id, 'รายได้จากการขายสินค้า')
        ON CONFLICT (store_id, transaction_type) DO NOTHING;
    END IF;

    IF v_sale_serv_id IS NOT NULL THEN
        INSERT INTO public.account_mapping_rules (store_id, organization_id, transaction_type, account_code_id, description)
        VALUES (p_store_id, p_org_id, 'sale_service', v_sale_serv_id, 'รายได้จากการให้บริการ (Grooming/Hotel)')
        ON CONFLICT (store_id, transaction_type) DO NOTHING;
    END IF;

    IF v_cogs_id IS NOT NULL THEN
        INSERT INTO public.account_mapping_rules (store_id, organization_id, transaction_type, account_code_id, description)
        VALUES (p_store_id, p_org_id, 'cogs', v_cogs_id, 'ต้นทุนขายสินค้า')
        ON CONFLICT (store_id, transaction_type) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;
