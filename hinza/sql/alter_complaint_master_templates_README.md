# Alter Complaint Master Templates - Add Company ID

This script adds a `company_id` column to the `complaint_master_templates` table to allow templates to be directly attached to specific companies.

## Overview

Previously, templates were linked to companies through the `company_complaint_types` table. This change allows templates to be directly associated with companies, simplifying the relationship.

## Changes Made

1. **Adds `company_id` column** - UUID, nullable initially
2. **Migrates existing data** - Sets company_id from `company_complaint_types` table
3. **Adds foreign key constraint** - Links to `companies` table with CASCADE delete
4. **Creates indexes** - For better query performance
5. **Adds unique constraint** - Prevents duplicate template names within the same company

## Table Structure After Migration

### `complaint_master_templates`
- `id` (UUID, Primary Key)
- `name` (TEXT, required)
- `description` (TEXT, nullable)
- `company_id` (UUID, nullable, Foreign Key to `companies.id`)
- Unique constraint on `(company_id, name)` when company_id is NOT NULL

## Migration Strategy

### Step 1: Run the ALTER Script
```sql
-- Run: hinza/sql/alter_complaint_master_templates_add_company_id.sql
```

### Step 2: Verify Migration
Check that all templates have been assigned to companies:
```sql
SELECT 
  COUNT(*) AS total_templates,
  COUNT(company_id) AS templates_with_company,
  COUNT(*) - COUNT(company_id) AS templates_without_company
FROM public.complaint_master_templates;
```

### Step 3: Optional - Make company_id NOT NULL
If all templates have been migrated and you want to enforce that all new templates must have a company_id:

```sql
-- First, ensure all templates have company_id
UPDATE public.complaint_master_templates
SET company_id = (
  SELECT company_id 
  FROM public.company_complaint_types 
  WHERE source_template_id = complaint_master_templates.id 
  LIMIT 1
)
WHERE company_id IS NULL;

-- Then make it NOT NULL
ALTER TABLE public.complaint_master_templates 
ALTER COLUMN company_id SET NOT NULL;
```

## Impact on Existing Code

### API Changes Needed

1. **Template Creation** (`/api/templates` POST):
   - Should now include `company_id` when creating master template
   - Example:
     ```typescript
     const { data: masterTemplate } = await supabase
       .from('complaint_master_templates')
       .insert({
         name: body.name,
         description: body.description || null,
         company_id: body.company_id,  // Add this
       })
     ```

2. **Template Fetching** (`/api/templates` GET):
   - Can now query directly by company_id:
     ```typescript
     const { data: templates } = await supabase
       .from('complaint_master_templates')
       .select('*')
       .eq('company_id', companyId)
     ```

3. **Template Updates**:
   - Can update company_id if needed
   - Can filter templates by company_id

## Backward Compatibility

- The `company_complaint_types` table still exists and can continue to be used
- Templates without `company_id` can still exist (nullable column)
- Existing queries that use `company_complaint_types` will continue to work

## Benefits

1. **Simplified Queries**: Direct relationship between templates and companies
2. **Better Performance**: Fewer joins needed
3. **Company Isolation**: Templates are clearly associated with companies
4. **Easier Management**: Can query templates directly by company

## Example Queries

### Get all templates for a company
```sql
SELECT * 
FROM public.complaint_master_templates
WHERE company_id = 'company-uuid'
ORDER BY name;
```

### Get template with fields for a company
```sql
SELECT 
  cmt.*,
  json_agg(
    json_build_object(
      'id', cmtf.id,
      'field_name', cmtf.field_name,
      'field_type', cmtf.field_type,
      'is_required', cmtf.is_required,
      'field_order', cmtf.field_order,
      'options', cmtf.options
    ) ORDER BY cmtf.field_order
  ) AS fields
FROM public.complaint_master_templates cmt
LEFT JOIN public.complaint_master_templates_fields cmtf 
  ON cmt.id = cmtf.template_id
WHERE cmt.company_id = 'company-uuid'
GROUP BY cmt.id
ORDER BY cmt.name;
```

### Count templates per company
```sql
SELECT 
  c.name AS company_name,
  COUNT(cmt.id) AS template_count
FROM public.companies c
LEFT JOIN public.complaint_master_templates cmt ON c.id = cmt.company_id
GROUP BY c.id, c.name
ORDER BY template_count DESC;
```

## Rollback (if needed)

If you need to rollback this change:

```sql
-- Remove foreign key constraint
ALTER TABLE public.complaint_master_templates 
DROP CONSTRAINT IF EXISTS fk_complaint_master_templates_company;

-- Remove indexes
DROP INDEX IF EXISTS idx_complaint_master_templates_company_id;
DROP INDEX IF EXISTS idx_complaint_master_templates_company_name;
DROP INDEX IF EXISTS idx_complaint_master_templates_company_name_unique;

-- Remove column
ALTER TABLE public.complaint_master_templates 
DROP COLUMN IF EXISTS company_id;
```

## Related Files

- `app/api/templates/route.ts` - Template API endpoints
- `types/template.ts` - TypeScript type definitions
- `features/companies/components/AddTemplateModal.tsx` - Template creation form
- `features/companies/components/ViewTemplatesModal.tsx` - Template viewing modal
