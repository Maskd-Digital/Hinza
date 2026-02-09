-- ============================================================================
-- Complaints Table - Full Schema (Create or Alter)
-- ============================================================================
-- Idempotent: safe to run multiple times.
-- Creates the table if it doesn't exist, or adds any missing columns/constraints
-- to an existing table.
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Step 1: Create table if it does not exist
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    priority TEXT,
    assigned_to UUID,
    product_id UUID,
    template_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- CAPA/SLA documents and verification (QA Manager workflow)
    capa_document_url TEXT,
    sla_document_url TEXT,
    capa_verified_at TIMESTAMP WITH TIME ZONE,
    sla_verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID,
    -- Foreign keys (added below if table already existed without them)
    CONSTRAINT fk_complaints_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_complaints_assigned_to FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL,
    CONSTRAINT fk_complaints_verified_by FOREIGN KEY (verified_by) REFERENCES public.users(id) ON DELETE SET NULL
);

-- ============================================================================
-- Step 2: Add missing columns if table already existed (idempotent)
-- ============================================================================
DO $$
BEGIN
    -- company_id (required; skip if table was just created with it)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'company_id') THEN
        ALTER TABLE public.complaints ADD COLUMN company_id UUID NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'title') THEN
        ALTER TABLE public.complaints ADD COLUMN title TEXT NOT NULL DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'description') THEN
        ALTER TABLE public.complaints ADD COLUMN description TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'status') THEN
        ALTER TABLE public.complaints ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'priority') THEN
        ALTER TABLE public.complaints ADD COLUMN priority TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'assigned_to') THEN
        ALTER TABLE public.complaints ADD COLUMN assigned_to UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'product_id') THEN
        ALTER TABLE public.complaints ADD COLUMN product_id UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'template_id') THEN
        ALTER TABLE public.complaints ADD COLUMN template_id UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'created_at') THEN
        ALTER TABLE public.complaints ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'updated_at') THEN
        ALTER TABLE public.complaints ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'capa_document_url') THEN
        ALTER TABLE public.complaints ADD COLUMN capa_document_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'sla_document_url') THEN
        ALTER TABLE public.complaints ADD COLUMN sla_document_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'capa_verified_at') THEN
        ALTER TABLE public.complaints ADD COLUMN capa_verified_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'sla_verified_at') THEN
        ALTER TABLE public.complaints ADD COLUMN sla_verified_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'verified_by') THEN
        ALTER TABLE public.complaints ADD COLUMN verified_by UUID;
    END IF;
END $$;

-- ============================================================================
-- Step 3: Add foreign key constraints if they don't exist
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND table_name = 'complaints' AND constraint_name = 'fk_complaints_company') THEN
        ALTER TABLE public.complaints ADD CONSTRAINT fk_complaints_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL; -- constraint already exists
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND table_name = 'complaints' AND constraint_name = 'fk_complaints_assigned_to') THEN
        ALTER TABLE public.complaints ADD CONSTRAINT fk_complaints_assigned_to FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND table_name = 'complaints' AND constraint_name = 'fk_complaints_verified_by') THEN
        ALTER TABLE public.complaints ADD CONSTRAINT fk_complaints_verified_by FOREIGN KEY (verified_by) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Optional: product_id and template_id FKs (if products and complaint_master_templates exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND table_name = 'complaints' AND constraint_name = 'fk_complaints_product') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
            ALTER TABLE public.complaints ADD CONSTRAINT fk_complaints_product FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
        END IF;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND table_name = 'complaints' AND constraint_name = 'fk_complaints_template') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'complaint_master_templates') THEN
            ALTER TABLE public.complaints ADD CONSTRAINT fk_complaints_template FOREIGN KEY (template_id) REFERENCES public.complaint_master_templates(id) ON DELETE SET NULL;
        END IF;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_table THEN NULL;
END $$;

-- ============================================================================
-- Step 4: Indexes for common queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_complaints_company_id ON public.complaints(company_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to ON public.complaints(assigned_to);
CREATE INDEX IF NOT EXISTS idx_complaints_company_status ON public.complaints(company_id, status);

-- ============================================================================
-- Step 5: updated_at trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION update_complaints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_complaints_updated_at ON public.complaints;
CREATE TRIGGER trigger_complaints_updated_at
    BEFORE UPDATE ON public.complaints
    FOR EACH ROW
    EXECUTE PROCEDURE update_complaints_updated_at();

-- ============================================================================
-- Step 6: Optional - Constrain status to allowed values (comment out if you use custom statuses)
-- ============================================================================
-- ALTER TABLE public.complaints DROP CONSTRAINT IF EXISTS chk_complaints_status;
-- ALTER TABLE public.complaints ADD CONSTRAINT chk_complaints_status
--     CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed'));

-- ============================================================================
-- Column reference (matches types/complaint.ts)
-- ============================================================================
-- id                 UUID PK
-- company_id         UUID NOT NULL -> companies(id)
-- title              TEXT NOT NULL
-- description        TEXT
-- status             TEXT NOT NULL (e.g. pending, in_progress, resolved, closed)
-- priority           TEXT (e.g. high, medium, low)
-- assigned_to        UUID -> users(id)  (QA executive / assignee)
-- product_id         UUID -> products(id)
-- template_id        UUID -> complaint_master_templates(id)
-- created_at         TIMESTAMPTZ
-- updated_at         TIMESTAMPTZ
-- capa_document_url  TEXT (link to CAPA document)
-- sla_document_url   TEXT (link to SLA document)
-- capa_verified_at   TIMESTAMPTZ (when QA manager verified CAPA)
-- sla_verified_at   TIMESTAMPTZ (when QA manager verified SLA)
-- verified_by        UUID -> users(id) (QA manager who verified)
