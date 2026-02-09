-- Add CAPA/SLA document and verification fields to complaints table
-- Run only if complaints table exists; safe to run multiple times

DO $$
BEGIN
  -- capa_document_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'capa_document_url'
  ) THEN
    ALTER TABLE public.complaints ADD COLUMN capa_document_url TEXT;
  END IF;

  -- sla_document_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'sla_document_url'
  ) THEN
    ALTER TABLE public.complaints ADD COLUMN sla_document_url TEXT;
  END IF;

  -- capa_verified_at (timestamp when QA manager verified CAPA)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'capa_verified_at'
  ) THEN
    ALTER TABLE public.complaints ADD COLUMN capa_verified_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- sla_verified_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'sla_verified_at'
  ) THEN
    ALTER TABLE public.complaints ADD COLUMN sla_verified_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- verified_by (user id of QA manager who verified documents)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'verified_by'
  ) THEN
    ALTER TABLE public.complaints ADD COLUMN verified_by UUID REFERENCES public.users(id);
  END IF;
END $$;
