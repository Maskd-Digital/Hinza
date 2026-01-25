-- SQL Script to Add company_id to complaint_master_templates Table
-- This allows templates to be directly attached to specific companies

-- ============================================
-- Step 1: Add company_id column (nullable initially)
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'complaint_master_templates' 
    AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.complaint_master_templates 
    ADD COLUMN company_id UUID NULL;
    
    RAISE NOTICE 'Added company_id column to complaint_master_templates';
  ELSE
    RAISE NOTICE 'company_id column already exists in complaint_master_templates';
  END IF;
END $$;

-- ============================================
-- Step 2: Migrate existing data from company_complaint_types
-- ============================================
-- Update existing templates with company_id from company_complaint_types
-- This links existing templates to their companies
UPDATE public.complaint_master_templates cmt
SET company_id = cct.company_id
FROM public.company_complaint_types cct
WHERE cmt.id = cct.source_template_id
AND cmt.company_id IS NULL;

-- ============================================
-- Step 3: Add foreign key constraint
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'complaint_master_templates' 
    AND constraint_name = 'fk_complaint_master_templates_company'
  ) THEN
    ALTER TABLE public.complaint_master_templates 
    ADD CONSTRAINT fk_complaint_master_templates_company 
    FOREIGN KEY (company_id) 
    REFERENCES public.companies(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added foreign key constraint for company_id';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists';
  END IF;
END $$;

-- ============================================
-- Step 4: Create indexes for better query performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_complaint_master_templates_company_id 
ON public.complaint_master_templates(company_id);

-- Index for queries filtering by company and name
CREATE INDEX IF NOT EXISTS idx_complaint_master_templates_company_name 
ON public.complaint_master_templates(company_id, name);

-- ============================================
-- Step 5: Optional - Make company_id NOT NULL after migration
-- ============================================
-- Uncomment the following if you want to enforce that all templates must have a company_id
-- Only do this after ensuring all existing templates have been migrated
/*
DO $$ 
BEGIN
  -- Check if there are any NULL company_id values
  IF NOT EXISTS (
    SELECT 1 FROM public.complaint_master_templates 
    WHERE company_id IS NULL
  ) THEN
    ALTER TABLE public.complaint_master_templates 
    ALTER COLUMN company_id SET NOT NULL;
    
    RAISE NOTICE 'Set company_id to NOT NULL';
  ELSE
    RAISE NOTICE 'Cannot set NOT NULL - there are templates without company_id';
  END IF;
END $$;
*/

-- ============================================
-- Step 6: Update unique constraint if needed
-- ============================================
-- If you want to ensure unique template names per company, you can add this constraint
-- This prevents duplicate template names within the same company
DO $$ 
BEGIN
  -- Drop existing unique constraint on name if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'complaint_master_templates' 
    AND constraint_name = 'complaint_master_templates_name_key'
  ) THEN
    ALTER TABLE public.complaint_master_templates 
    DROP CONSTRAINT complaint_master_templates_name_key;
    
    RAISE NOTICE 'Dropped existing unique constraint on name';
  END IF;
  
  -- Create unique constraint on (company_id, name) if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'complaint_master_templates' 
    AND constraint_name = 'complaint_master_templates_company_name_key'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_complaint_master_templates_company_name_unique
    ON public.complaint_master_templates(company_id, name)
    WHERE company_id IS NOT NULL;
    
    RAISE NOTICE 'Created unique constraint on (company_id, name)';
  ELSE
    RAISE NOTICE 'Unique constraint on (company_id, name) already exists';
  END IF;
END $$;

-- ============================================
-- Verification Queries
-- ============================================
-- Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'complaint_master_templates'
ORDER BY ordinal_position;

-- Check foreign key constraints
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' 
AND table_name = 'complaint_master_templates';

-- Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
AND tablename = 'complaint_master_templates';

-- Count templates by company
SELECT 
  COALESCE(c.name, 'No Company') AS company_name,
  COUNT(*) AS template_count
FROM public.complaint_master_templates cmt
LEFT JOIN public.companies c ON cmt.company_id = c.id
GROUP BY c.name, cmt.company_id
ORDER BY template_count DESC;

-- Check for templates without company_id (if any)
SELECT 
  id,
  name,
  company_id
FROM public.complaint_master_templates
WHERE company_id IS NULL;

-- ============================================
-- Notes
-- ============================================
-- 1. The company_id column is initially nullable to allow migration of existing data
-- 2. After migration, you can optionally make it NOT NULL (see Step 5)
-- 3. The unique constraint on (company_id, name) ensures no duplicate template names per company
-- 4. Templates without company_id can still exist (for backward compatibility)
-- 5. Foreign key constraint ensures company_id references a valid company
-- 6. CASCADE delete means if a company is deleted, its templates are also deleted
