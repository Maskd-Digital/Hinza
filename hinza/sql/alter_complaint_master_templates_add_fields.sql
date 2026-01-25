-- SQL Script to Add fields JSONB Column to complaint_master_templates Table
-- This allows template fields to be stored directly in the templates table as JSONB
-- This simplifies queries and reduces the need for joins with complaint_master_templates_fields
-- Also ensures company_id column exists to attach templates to specific companies

-- ============================================
-- Step 1: Ensure company_id column exists
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
-- Step 1b: Fix unique constraint to allow same name per company
-- ============================================
-- Drop old global unique constraint on name, create per-company constraint
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
-- Step 2: Add fields JSONB column
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'complaint_master_templates' 
    AND column_name = 'fields'
  ) THEN
    ALTER TABLE public.complaint_master_templates 
    ADD COLUMN fields JSONB NULL DEFAULT '[]'::jsonb;
    
    RAISE NOTICE 'Added fields JSONB column to complaint_master_templates';
  ELSE
    RAISE NOTICE 'fields column already exists in complaint_master_templates';
  END IF;
END $$;

-- ============================================
-- Step 3: Migrate existing data from complaint_master_template_fields
-- ============================================
-- Convert existing fields from the separate table into JSONB format
-- Maps field_label to field_name and generates field_order based on id order
DO $$
DECLARE
  template_rec RECORD;
  field_rec RECORD;
  fields_array jsonb := '[]'::jsonb;
  field_order integer;
BEGIN
  FOR template_rec IN 
    SELECT id FROM public.complaint_master_templates
    WHERE EXISTS (
      SELECT 1 FROM public.complaint_master_template_fields cmtf
      WHERE cmtf.template_id = complaint_master_templates.id
    )
  LOOP
    fields_array := '[]'::jsonb;
    field_order := 1;
    
    FOR field_rec IN 
      SELECT id, field_label, field_type, is_required, options
      FROM public.complaint_master_template_fields
      WHERE template_id = template_rec.id
      ORDER BY id
    LOOP
      fields_array := fields_array || jsonb_build_object(
        'id', field_rec.id,
        'field_name', field_rec.field_label,
        'field_type', field_rec.field_type,
        'is_required', field_rec.is_required,
        'field_order', field_order,
        'options', COALESCE(field_rec.options, '[]'::jsonb)
      );
      field_order := field_order + 1;
    END LOOP;
    
    UPDATE public.complaint_master_templates
    SET fields = fields_array
    WHERE id = template_rec.id;
  END LOOP;
  
  RAISE NOTICE 'Migrated fields from complaint_master_template_fields';
END $$;

-- Set default empty array for templates without fields
UPDATE public.complaint_master_templates
SET fields = '[]'::jsonb
WHERE fields IS NULL;

-- ============================================
-- Step 4: Add GIN index for efficient JSONB queries
-- ============================================
-- GIN (Generalized Inverted Index) is optimal for JSONB queries
CREATE INDEX IF NOT EXISTS idx_complaint_master_templates_fields_gin 
ON public.complaint_master_templates USING GIN (fields);

-- Index for querying specific field names within the JSONB array
-- This allows efficient queries like: WHERE fields @> '[{"field_name": "product"}]'
-- Note: The GIN index on the fields column itself is sufficient for most queries
-- This additional index is optional and may not be needed
-- CREATE INDEX IF NOT EXISTS idx_complaint_master_templates_fields_field_name 
-- ON public.complaint_master_templates USING GIN ((fields -> 'field_name'));

-- ============================================
-- Step 5: Add constraint to ensure fields is always an array
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'complaint_master_templates' 
    AND constraint_name = 'check_fields_is_array'
  ) THEN
    ALTER TABLE public.complaint_master_templates 
    ADD CONSTRAINT check_fields_is_array 
    CHECK (jsonb_typeof(fields) = 'array');
    
    RAISE NOTICE 'Added constraint to ensure fields is always an array';
  ELSE
    RAISE NOTICE 'Constraint check_fields_is_array already exists';
  END IF;
END $$;

-- ============================================
-- Step 6: Optional - Make fields NOT NULL
-- ============================================
-- Uncomment the following if you want to enforce that all templates must have a fields array
-- Since we're setting a default of '[]'::jsonb, this should be safe
/*
DO $$ 
BEGIN
  ALTER TABLE public.complaint_master_templates 
  ALTER COLUMN fields SET NOT NULL;
  
  RAISE NOTICE 'Set fields to NOT NULL';
END $$;
*/

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

-- Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
AND tablename = 'complaint_master_templates'
AND indexname LIKE '%fields%';

-- Sample query to view templates with their fields
-- Note: company_id is included only if it exists (from alter_complaint_master_templates_add_company_id.sql)
SELECT 
  id,
  name,
  jsonb_array_length(fields) AS field_count,
  fields
FROM public.complaint_master_templates
ORDER BY name
LIMIT 5;

-- Count templates by field count
SELECT 
  jsonb_array_length(fields) AS field_count,
  COUNT(*) AS template_count
FROM public.complaint_master_templates
GROUP BY jsonb_array_length(fields)
ORDER BY field_count;

-- Example query: Find templates with a specific field name
-- SELECT id, name, fields
-- FROM public.complaint_master_templates
-- WHERE fields @> '[{"field_name": "product"}]';

-- Example query: Find templates with required fields
-- SELECT id, name, fields
-- FROM public.complaint_master_templates
-- WHERE fields @> '[{"is_required": true}]';

-- ============================================
-- Notes
-- ============================================
-- 1. The fields column stores an array of field objects in JSONB format
-- 2. Each field object has the structure:
--    {
--      "id": "uuid",
--      "field_name": "string",
--      "field_type": "text|number|date|select|textarea|boolean|file",
--      "is_required": boolean,
--      "field_order": number,
--      "options": [] // For select fields
--    }
-- 3. GIN indexes allow efficient querying of JSONB data
-- 4. The constraint ensures fields is always an array (even if empty)
-- 5. Existing data from complaint_master_templates_fields is migrated automatically
-- 6. You can still use the separate fields table if needed, but the JSONB column
--    provides a more convenient way to access all fields in a single query
-- 7. To query specific fields, use JSONB operators:
--    - @> (contains): WHERE fields @> '[{"field_name": "product"}]'
--    - -> (get JSON object field): fields->0 (get first field)
--    - ->> (get JSON object field as text): fields->0->>'field_name'
--    - jsonb_array_elements: to expand array into rows
