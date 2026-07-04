-- Create Held Bills Table
CREATE TABLE IF NOT EXISTS public.held_bills (
    id TEXT PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_id TEXT,
    customer_name TEXT,
    items JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.held_bills ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Enable read access for all authenticated users" ON public.held_bills FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for all authenticated users" ON public.held_bills FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for all authenticated users" ON public.held_bills FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete access for all authenticated users" ON public.held_bills FOR DELETE TO authenticated USING (true);
