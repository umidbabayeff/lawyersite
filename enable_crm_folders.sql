-- Add parent_id and is_folder to crm_documents table
ALTER TABLE public.crm_documents
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.crm_documents(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS is_folder boolean DEFAULT false;
-- Create index for parent_id to speed up folder lookups
CREATE INDEX IF NOT EXISTS idx_crm_documents_parent_id ON public.crm_documents(parent_id);
-- Update RLS policies (existing ones check case_id which is still present on folders)
-- No changes needed if we ensure even nested items have case_id.
-- However, for safety, let's ensure we always insert case_id even for sub-items.
-- Add validation: Folders cannot be parents of themselves (prevent simple loops)
-- Complex recursive loop prevention is hard in pure SQL CHECK constraints, typically handled in app logic.