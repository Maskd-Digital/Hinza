-- ============================================================================
-- Alter Complaints Table - Align with Current Definition
-- ============================================================================
-- Your table uses: assigned_to_id, complaint_type_id, submitted_by_id, batch_id,
-- parent_id, level, enum complaint_status. This script:
-- 1. Ensures the updated_at trigger function exists
-- 2. Fixes trigger to use EXECUTE PROCEDURE (standard PostgreSQL)
-- 3. Adds missing index on assigned_to_id for assignee queries
-- 4. Does not rename columns (app layer should map assigned_to_id <-> assigned_to)
-- Idempotent; safe to run multiple times.
-- ============================================================================

-- Step 1: Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_complaints_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Step 2: Drop and recreate trigger (use EXECUTE PROCEDURE for compatibility)
DROP TRIGGER IF EXISTS trigger_complaints_updated_at ON public.complaints;

CREATE TRIGGER trigger_complaints_updated_at
    BEFORE UPDATE ON public.complaints
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_complaints_updated_at();

-- Step 3: Indexes (only create if not exists)
CREATE INDEX IF NOT EXISTS idx_complaints_company_id
    ON public.complaints USING btree (company_id);

CREATE INDEX IF NOT EXISTS idx_complaints_status
    ON public.complaints USING btree (status);

CREATE INDEX IF NOT EXISTS idx_complaints_created_at
    ON public.complaints USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_complaints_company_status
    ON public.complaints USING btree (company_id, status);

-- Index for assignee filtering (QA Manager / delegation)
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to_id
    ON public.complaints USING btree (assigned_to_id);

-- Optional: indexes for other common filters
CREATE INDEX IF NOT EXISTS idx_complaints_submitted_by_id
    ON public.complaints USING btree (submitted_by_id);

CREATE INDEX IF NOT EXISTS idx_complaints_complaint_type_id
    ON public.complaints USING btree (complaint_type_id);

CREATE INDEX IF NOT EXISTS idx_complaints_parent_id
    ON public.complaints USING btree (parent_id);

-- ============================================================================
-- App mapping note
-- ============================================================================
-- The app types use "assigned_to"; your table has "assigned_to_id".
-- Either:
--   (a) In API/select, alias: select assigned_to_id as assigned_to, and
--       on PATCH map body.assigned_to -> assigned_to_id, or
--   (b) Update app types and API to use assigned_to_id everywhere.
-- ============================================================================
