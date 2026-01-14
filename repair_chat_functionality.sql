-- FLUSH AND REPAIR CHAT SCHEMA
-- 1. Ensure MESSAGES table has all columns
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS type text DEFAULT 'text';
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS file_name text;
-- 2. Drop existing policies to prevent conflicts/duplicates
DROP POLICY IF EXISTS "Users can see their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
-- 3. Re-create RLS for MESSAGES
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their messages" ON public.messages FOR
SELECT USING (
        auth.uid() = sender_id
        OR auth.uid() = receiver_id
    );
CREATE POLICY "Users can send messages" ON public.messages FOR
INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update their own messages" ON public.messages FOR
UPDATE USING (auth.uid() = sender_id);
-- For editing or deleting if needed later
-- 4. Ensure CONNECTION_REQUESTS RLS is robust
DROP POLICY IF EXISTS "Users can see requests relating to them" ON public.connection_requests;
DROP POLICY IF EXISTS "Users can insert requests" ON public.connection_requests;
DROP POLICY IF EXISTS "Users can update requests sent to them" ON public.connection_requests;
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see requests relating to them" ON public.connection_requests FOR
SELECT USING (
        auth.uid() = sender_id
        OR auth.uid() = receiver_id
    );
CREATE POLICY "Users can insert requests" ON public.connection_requests FOR
INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update requests sent to them" ON public.connection_requests FOR
UPDATE USING (auth.uid() = receiver_id);
-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);