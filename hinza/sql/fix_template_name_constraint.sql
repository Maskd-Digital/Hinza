-- Quick Fix: Update unique constraint on complaint_master_templates
-- This allows templates with the same name in different companies
-- Run this if you're getting "duplicate key value violates unique constraint complaint_master_templates_name_key"

-- Drop old global unique constraint on name
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'complaint_master_templates' 
    AND constraint_name = 'complaint_master_templates_name_key'
  ) THEN
    ALTER TABLE public.complaint_master_templates 
    DROP CONSTRAINT complaint_master_templates_name_key;
    
    RAISE NOTICE 'Dropped existing unique constraint on name';
  ELSE
    RAISE NOTICE 'Old unique constraint on name does not exist';
  END IF;
END $$;

-- Create new unique constraint on (company_id, name) - allows same name per company
DO $$ 
BEGIN
  -- Drop the index if it exists first
  DROP INDEX IF EXISTS idx_complaint_master_templates_company_name_unique;
  
  -- Create unique constraint on (company_id, name)
  CREATE UNIQUE INDEX idx_complaint_master_templates_company_name_unique
  ON public.complaint_master_templates(company_id, name)
  WHERE company_id IS NOT NULL;
  
  RAISE NOTICE 'Created unique constraint on (company_id, name)';
END $$;

-- Verify the constraint
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' 
AND table_name = 'complaint_master_templates'
AND constraint_type = 'UNIQUE';
