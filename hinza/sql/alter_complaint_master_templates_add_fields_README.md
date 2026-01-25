# Add Fields JSONB Column to complaint_master_templates

This script adds a `fields` JSONB column to the `complaint_master_templates` table to store template fields directly in the template record.

## Overview

Instead of requiring a separate join with `complaint_master_templates_fields`, template fields are now stored as a JSONB array directly in the `complaint_master_templates` table. This simplifies queries and improves performance.

## Changes Made

### 1. Added `fields` JSONB Column
- **Column Name:** `fields`
- **Data Type:** `JSONB`
- **Default Value:** `[]` (empty array)
- **Nullable:** Yes (but defaults to empty array)

### 2. Data Migration
- Automatically migrates existing fields from `complaint_master_templates_fields` table
- Converts field records into JSONB array format
- Preserves field order using `field_order`

### 3. Indexes
- **GIN Index on `fields`:** For efficient JSONB queries
- **GIN Index on `fields->>'field_name'`:** For querying specific field names

### 4. Constraints
- **Check Constraint:** Ensures `fields` is always a JSONB array

## Field Structure

Each field in the `fields` array has the following structure:

```json
{
  "id": "uuid",
  "field_name": "string",
  "field_type": "text|number|date|select|textarea|boolean|file",
  "is_required": boolean,
  "field_order": number,
  "options": [] // Optional, for select fields
}
```

## Usage Examples

### Query Templates with Fields

```sql
-- Get all templates with their fields
SELECT id, name, company_id, fields
FROM public.complaint_master_templates
WHERE company_id = 'your-company-id';
```

### Find Templates with Specific Field

```sql
-- Find templates containing a field named "product"
SELECT id, name, fields
FROM public.complaint_master_templates
WHERE fields @> '[{"field_name": "product"}]';
```

### Find Templates with Required Fields

```sql
-- Find templates with any required fields
SELECT id, name, fields
FROM public.complaint_master_templates
WHERE fields @> '[{"is_required": true}]';
```

### Get Field Count

```sql
-- Count fields per template
SELECT 
  id,
  name,
  jsonb_array_length(fields) AS field_count
FROM public.complaint_master_templates;
```

### Expand Fields into Rows

```sql
-- Expand fields array into individual rows
SELECT 
  cmt.id AS template_id,
  cmt.name AS template_name,
  field->>'field_name' AS field_name,
  field->>'field_type' AS field_type,
  (field->>'is_required')::boolean AS is_required
FROM public.complaint_master_templates cmt,
     jsonb_array_elements(cmt.fields) AS field
ORDER BY cmt.name, (field->>'field_order')::int;
```

## API Integration

When using this in your API, you can now fetch templates with fields in a single query:

```typescript
const { data: templates } = await supabase
  .from('complaint_master_templates')
  .select('id, name, description, company_id, fields')
  .eq('company_id', companyId);

// fields is already an array, no need for separate query
templates.forEach(template => {
  console.log(template.fields); // Array of field objects
});
```

## Migration Notes

1. **Existing Data:** All existing fields from `complaint_master_templates_fields` are automatically migrated
2. **Backward Compatibility:** The `complaint_master_templates_fields` table still exists and can be used if needed
3. **Default Value:** New templates without fields will have an empty array `[]`
4. **Performance:** GIN indexes provide efficient querying of JSONB data

## Running the Script

```bash
# Run the SQL script in your Supabase SQL editor or psql
psql -h your-db-host -U your-user -d your-database -f alter_complaint_master_templates_add_fields.sql
```

Or execute it directly in the Supabase SQL Editor.

## Verification

After running the script, verify the changes:

```sql
-- Check column exists
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'complaint_master_templates' 
AND column_name = 'fields';

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'complaint_master_templates'
AND indexname LIKE '%fields%';

-- Sample data
SELECT id, name, jsonb_array_length(fields) AS field_count
FROM public.complaint_master_templates
LIMIT 10;
```

## Benefits

1. **Simplified Queries:** No need for joins with `complaint_master_templates_fields`
2. **Better Performance:** Single query instead of multiple queries
3. **Atomic Operations:** Fields are stored with the template, ensuring consistency
4. **Flexible Schema:** JSONB allows for easy schema evolution
5. **Efficient Indexing:** GIN indexes provide fast JSONB queries

## Considerations

- The `complaint_master_templates_fields` table can still be used for more complex queries if needed
- JSONB queries require understanding of PostgreSQL JSONB operators
- Field validation should be done at the application level
- Consider adding application-level validation for field structure
