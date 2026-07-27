CREATE TABLE IF NOT EXISTS public.daycare_pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  hours numeric NOT NULL,
  price numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.daycare_pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated" ON public.daycare_pricing_rules 
FOR ALL TO authenticated USING (true) WITH CHECK (true);
