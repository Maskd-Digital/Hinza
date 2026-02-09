-- Add deadline and submitted_for_verification_at to complaints (QA Executive workflow)
-- Idempotent; safe to run multiple times.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'deadline'
  ) THEN
    ALTER TABLE public.complaints ADD COLUMN deadline TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'submitted_for_verification_at'
  ) THEN
    ALTER TABLE public.complaints ADD COLUMN submitted_for_verification_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_complaints_deadline ON public.complaints(deadline) WHERE deadline IS NOT NULL;
