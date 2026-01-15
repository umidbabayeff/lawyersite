-- Create CRM Documents table
CREATE TABLE IF NOT EXISTS public.crm_documents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE,
    file_name text NOT NULL,
    file_url text NOT NULL,
    source text DEFAULT 'upload',
    -- 'upload' or 'chat'
    uploaded_at timestamptz DEFAULT now()
);
-- Enable RLS
ALTER TABLE public.crm_documents ENABLE ROW LEVEL SECURITY;
-- Policies
-- We need to check if the user is the lawyer of the parent case.
-- This requires a join or a subquery. For simplicity/performance in RLS, we can rely on the fact that only lawyers can GET the case ID.
-- OR we can add `lawyer_id` denormalized to crm_documents?
-- Let's stick to a simple subquery check:
CREATE POLICY "Lawyers can view documents of their cases" ON public.crm_documents FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.cases
            WHERE cases.id = crm_documents.case_id
                AND cases.lawyer_id = auth.uid()
        )
    );
CREATE POLICY "Lawyers can insert documents to their cases" ON public.crm_documents FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.cases
            WHERE cases.id = crm_documents.case_id
                AND cases.lawyer_id = auth.uid()
        )
    );
CREATE POLICY "Lawyers can delete documents of their cases" ON public.crm_documents FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM public.cases
        WHERE cases.id = crm_documents.case_id
            AND cases.lawyer_id = auth.uid()
    )
);