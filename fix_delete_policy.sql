-- Enable RLS for DELETE on community_requests
-- Run this in Supabase SQL Editor
-- 1. Ensure RLS is enabled
ALTER TABLE community_requests ENABLE ROW LEVEL SECURITY;
-- 2. Create Policy for Deleting own requests
-- Drop if exists to avoid error on duplicated run
DROP POLICY IF EXISTS "Users can delete their own requests" ON community_requests;
CREATE POLICY "Users can delete their own requests" ON community_requests FOR DELETE TO authenticated USING (auth.uid() = client_id);
-- 3. Also allow deleting proposals if they belong to your request (Optional, if you want cascading via RLS instead of DB)
-- But DB CASCADE is better. This is just a backup.
ALTER TABLE request_proposals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can delete proposals of their own requests" ON request_proposals;
CREATE POLICY "Users can delete proposals of their own requests" ON request_proposals FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM community_requests
        WHERE community_requests.id = request_proposals.request_id
            AND community_requests.client_id = auth.uid()
    )
);