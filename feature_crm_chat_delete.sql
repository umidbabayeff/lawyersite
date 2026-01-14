-- Create CASES table for CRM
CREATE TABLE IF NOT EXISTS public.cases (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lawyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id uuid REFERENCES auth.users(id) ON DELETE
    SET NULL,
        -- Client might be deleted
        client_name text,
        title text NOT NULL,
        description text,
        status text DEFAULT 'new' CHECK (
            status IN ('new', 'in_progress', 'court', 'completed')
        ),
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
);
-- Enable RLS
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Lawyers can view their own cases" ON public.cases FOR
SELECT USING (auth.uid() = lawyer_id);
CREATE POLICY "Lawyers can insert their own cases" ON public.cases FOR
INSERT WITH CHECK (auth.uid() = lawyer_id);
CREATE POLICY "Lawyers can update their own cases" ON public.cases FOR
UPDATE USING (auth.uid() = lawyer_id);
CREATE POLICY "Lawyers can delete their own cases" ON public.cases FOR DELETE USING (auth.uid() = lawyer_id);
-- Index for performance
CREATE INDEX IF NOT EXISTS idx_cases_lawyer_id ON public.cases(lawyer_id);
-- RE-VERIFY MESSAGES DELETE POLICY
-- Ensure users can delete messages they are part of
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
CREATE POLICY "Users can delete messages they are involved in" ON public.messages FOR DELETE USING (
    auth.uid() = sender_id
    OR auth.uid() = receiver_id
);