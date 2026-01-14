-- Fix Read Receipt Permissions
-- The previous policy only allowed the SENDER to update messages.
-- We need to allow the RECEIVER to update messages (to mark them as read).
-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
-- Create a new inclusive policy
CREATE POLICY "Users can update messages they are involved in" ON public.messages FOR
UPDATE USING (
        auth.uid() = sender_id
        OR auth.uid() = receiver_id
    );