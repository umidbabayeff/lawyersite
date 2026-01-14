-- Add columns for chat improvements
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS type text DEFAULT 'text',
    ADD COLUMN IF NOT EXISTS file_url text,
    ADD COLUMN IF NOT EXISTS file_name text;
-- Create an index to speed up fetching user chats (optional but good)
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_read ON public.messages(receiver_id, is_read);