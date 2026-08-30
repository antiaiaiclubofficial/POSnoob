-- Add line_oa_chat_url to customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS line_oa_chat_url TEXT;
