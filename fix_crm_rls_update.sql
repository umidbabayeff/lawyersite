-- Enable UPDATE policy for crm_documents
-- This is required for renaming files and moving files to folders
CREATE POLICY "Lawyers can update documents of their cases" ON public.crm_documents FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM public.cases
            WHERE cases.id = crm_documents.case_id
                AND cases.lawyer_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.cases
            WHERE cases.id = crm_documents.case_id
                AND cases.lawyer_id = auth.uid()
        )
    );