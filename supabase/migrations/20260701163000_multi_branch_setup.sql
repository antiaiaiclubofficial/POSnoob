-- 20260701163000_multi_branch_setup.sql

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Add organization_id to stores (branches)
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add organization_id to profiles (users)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Default Data Migration: Create a default organization for existing stores
DO $$
DECLARE
    store_record RECORD;
    org_id UUID;
BEGIN
    FOR store_record IN SELECT * FROM public.stores WHERE organization_id IS NULL LOOP
        -- Create org for this store
        INSERT INTO public.organizations (name) VALUES (store_record.name || ' (HQ)') RETURNING id INTO org_id;
        
        -- Update the store
        UPDATE public.stores SET organization_id = org_id WHERE id = store_record.id;
        
        -- Update the profiles linked to this store
        UPDATE public.profiles SET organization_id = org_id WHERE store_id = store_record.id;
    END LOOP;
END $$;

-- Policies for organizations
CREATE POLICY "Enable read access for authenticated users to their own org" ON public.organizations FOR SELECT TO authenticated USING (
  id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Enable insert access for authenticated users" ON public.organizations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for org members" ON public.organizations FOR UPDATE TO authenticated USING (
  id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

-- Policy for stores
CREATE POLICY "Enable read access to stores in same organization" ON public.stores FOR SELECT TO authenticated USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);
