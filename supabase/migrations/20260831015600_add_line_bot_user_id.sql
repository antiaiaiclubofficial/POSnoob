-- Add line_bot_user_id to stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS line_bot_user_id TEXT;
