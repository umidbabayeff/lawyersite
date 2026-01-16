-- If deleting a request fails, run this SQL in your Supabase SQL Editor
-- This ensures that when a request is deleted, all related proposals are also deleted automatically.
ALTER TABLE request_proposals DROP CONSTRAINT request_proposals_request_id_fkey,
    ADD CONSTRAINT request_proposals_request_id_fkey FOREIGN KEY (request_id) REFERENCES community_requests(id) ON DELETE CASCADE;