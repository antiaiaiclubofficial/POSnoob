-- Migration for LINE Webhook feature

-- Add line_channel_secret to stores if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='line_channel_secret') THEN
        ALTER TABLE stores ADD COLUMN line_channel_secret TEXT;
    END IF;
END $$;

-- Create chat_messages table to store incoming and outgoing LINE messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    customer_line_uid TEXT NOT NULL,
    message_type TEXT NOT NULL, -- e.g., 'text', 'image', 'sticker'
    message_text TEXT,
    direction TEXT NOT NULL CHECK (direction IN ('in', 'out')), -- 'in' = from customer, 'out' = from bot/shop
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster retrieval when displaying chat history
CREATE INDEX IF NOT EXISTS idx_chat_messages_store_uid ON chat_messages(store_id, customer_line_uid);

-- RLS policies for chat_messages (Assuming staff can view messages for their store)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users to their store's chats"
ON chat_messages FOR SELECT
TO authenticated
USING (
    store_id IN (
        SELECT store_id FROM profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Enable insert access for edge functions and authenticated users"
ON chat_messages FOR INSERT
TO authenticated, anon
WITH CHECK (true); -- Usually edge functions run with service_role, bypassing RLS, but this allows flexibility.
