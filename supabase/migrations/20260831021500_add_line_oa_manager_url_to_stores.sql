-- Add line_oa_manager_url to stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS line_oa_manager_url TEXT;
