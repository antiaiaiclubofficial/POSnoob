-- Create Account Codes Table
CREATE TABLE IF NOT EXISTS public.account_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Assets', 'Liabilities', 'Equity', 'Revenue', 'Expenses')),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Journal Entries Table
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id TEXT PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    journal_type TEXT NOT NULL CHECK (journal_type IN ('JV', 'PJ', 'SJ', 'CR', 'CP')),
    reference_no TEXT,
    description TEXT NOT NULL,
    lines JSONB NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Draft', 'Posted', 'Void')),
    total_debit DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_credit DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_by TEXT,
    is_opening_balance BOOLEAN DEFAULT false,
    is_closing_entry BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Tax Records Table
CREATE TABLE IF NOT EXISTS public.tax_records (
    id TEXT PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Input', 'Output', 'Withholding')),
    reference_no TEXT NOT NULL,
    partner_name TEXT NOT NULL,
    tax_id TEXT,
    base_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    journal_entry_id TEXT REFERENCES public.journal_entries(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Filed', 'Cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.account_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_records ENABLE ROW LEVEL SECURITY;

-- Create Policies (Assuming 'service_role' or logged in user checking store_id)
-- To keep it simple and aligned with existing structure, we allow all authenticated users
-- for now, filtering usually happens on the client side, but ideally it should match the auth.uid()

CREATE POLICY "Enable read access for all authenticated users" ON public.account_codes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for all authenticated users" ON public.account_codes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for all authenticated users" ON public.account_codes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete access for all authenticated users" ON public.account_codes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Enable read access for all authenticated users" ON public.journal_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for all authenticated users" ON public.journal_entries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for all authenticated users" ON public.journal_entries FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete access for all authenticated users" ON public.journal_entries FOR DELETE TO authenticated USING (true);

CREATE POLICY "Enable read access for all authenticated users" ON public.tax_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for all authenticated users" ON public.tax_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for all authenticated users" ON public.tax_records FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete access for all authenticated users" ON public.tax_records FOR DELETE TO authenticated USING (true);
