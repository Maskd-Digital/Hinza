# Products Table with Self-Referencing Hierarchy (Adjacency List)

This document describes the products table structure that implements a hierarchical tree using the adjacency list pattern.

## Table Structure

### Core Fields

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `company_id` | UUID | Foreign key to `companies` table |
| `parent_id` | UUID (nullable) | Self-referencing foreign key to `products.id`. NULL for root-level products |
| `name` | TEXT | Product name (required) |
| `level` | INTEGER | Hierarchy level (0 = root, 1 = first child, etc.). Automatically calculated |
| `description` | TEXT (nullable) | Optional product description |
| `created_at` | TIMESTAMP | Auto-set on creation |
| `updated_at` | TIMESTAMP | Auto-updated on modification |

### Constraints

1. **Primary Key**: `id`
2. **Foreign Keys**:
   - `company_id` → `companies.id` (CASCADE delete)
   - `parent_id` → `products.id` (SET NULL on delete - prevents orphaned children)
3. **Business Rules** (enforced by triggers):
   - A product cannot be its own parent
   - No circular references allowed
   - Parent must belong to the same company
   - Level is automatically calculated based on parent

### Indexes

- `idx_products_company_id`: Fast filtering by company
- `idx_products_parent_id`: Fast lookup of children
- `idx_products_level`: Fast filtering by hierarchy level
- `idx_products_company_parent`: Composite index for company + parent queries
- `idx_products_company_level`: Composite index for company + level queries

## Hierarchy Pattern: Adjacency List

The adjacency list pattern stores the parent-child relationship directly in each row via the `parent_id` column. This is simple and efficient for:
- Finding direct children
- Finding immediate parent
- Inserting new nodes
- Moving subtrees

### Example Hierarchy

```
Company A
├── Product Category 1 (level 0, parent_id: NULL)
│   ├── Product Subcategory 1.1 (level 1, parent_id: category-1-id)
│   │   ├── Product 1.1.1 (level 2, parent_id: subcategory-1.1-id)
│   │   └── Product 1.1.2 (level 2, parent_id: subcategory-1.1-id)
│   └── Product Subcategory 1.2 (level 1, parent_id: category-1-id)
└── Product Category 2 (level 0, parent_id: NULL)
    └── Product 2.1 (level 1, parent_id: category-2-id)
```

## Common Queries

### Get all root-level products (no parent)

```sql
SELECT * FROM products
WHERE company_id = 'company-uuid'
AND parent_id IS NULL
ORDER BY name;
```

### Get all direct children of a product

```sql
SELECT * FROM products
WHERE parent_id = 'product-uuid'
ORDER BY name;
```

### Get all products at a specific level

```sql
SELECT * FROM products
WHERE company_id = 'company-uuid'
AND level = 1
ORDER BY name;
```

### Get a product with its parent information

```sql
SELECT 
  p.*,
  parent.name AS parent_name,
  parent.level AS parent_level
FROM products p
LEFT JOIN products parent ON p.parent_id = parent.id
WHERE p.id = 'product-uuid';
```

### Get full path to root (using recursive CTE)

```sql
WITH RECURSIVE product_path AS (
  -- Start with the target product
  SELECT id, name, parent_id, level, ARRAY[name] AS path
  FROM products
  WHERE id = 'product-uuid'
  
  UNION ALL
  
  -- Recursively get parents
  SELECT p.id, p.name, p.parent_id, p.level, pp.path || p.name
  FROM products p
  INNER JOIN product_path pp ON p.id = pp.parent_id
)
SELECT * FROM product_path
ORDER BY level DESC;
```

### Get all descendants of a product (using recursive CTE)

```sql
WITH RECURSIVE product_tree AS (
  -- Start with the root product
  SELECT id, name, parent_id, level, 0 AS depth
  FROM products
  WHERE id = 'product-uuid'
  
  UNION ALL
  
  -- Recursively get children
  SELECT p.id, p.name, p.parent_id, p.level, pt.depth + 1
  FROM products p
  INNER JOIN product_tree pt ON p.parent_id = pt.id
)
SELECT * FROM product_tree
ORDER BY level, name;
```

### Count products by level for a company

```sql
SELECT 
  level,
  COUNT(*) AS product_count
FROM products
WHERE company_id = 'company-uuid'
GROUP BY level
ORDER BY level;
```

### Get product tree structure (formatted)

```sql
WITH RECURSIVE product_tree AS (
  -- Root products
  SELECT 
    id,
    name,
    parent_id,
    level,
    name AS path,
    0 AS depth
  FROM products
  WHERE company_id = 'company-uuid'
  AND parent_id IS NULL
  
  UNION ALL
  
  -- Children
  SELECT 
    p.id,
    p.name,
    p.parent_id,
    p.level,
    pt.path || ' > ' || p.name,
    pt.depth + 1
  FROM products p
  INNER JOIN product_tree pt ON p.parent_id = pt.id
)
SELECT 
  REPEAT('  ', depth) || name AS formatted_name,
  path,
  level
FROM product_tree
ORDER BY path;
```

## Automatic Features

### 1. Level Calculation
The `level` field is automatically calculated when a product is inserted or updated:
- Root products (no parent): `level = 0`
- Child products: `level = parent.level + 1`

### 2. Updated Timestamp
The `updated_at` field is automatically updated whenever a product row is modified.

### 3. Circular Reference Prevention
The system prevents:
- A product from being its own parent
- Circular references in the hierarchy
- Products from having parents in different companies

## Migration Notes

### If table doesn't exist
Run the full `create_products_table.sql` script.

### If table already exists
The script includes `IF NOT EXISTS` checks and will:
- Add missing columns
- Add missing constraints
- Add missing indexes
- Create triggers and functions

### Safe to run multiple times
The script is idempotent - you can run it multiple times safely.

## Performance Considerations

1. **Indexes**: All common query patterns are indexed for optimal performance
2. **Recursive Queries**: For deep hierarchies, recursive CTEs may be slower. Consider:
   - Limiting depth in queries
   - Caching frequently accessed paths
   - Using materialized views for complex trees
3. **Bulk Operations**: When moving large subtrees, consider:
   - Disabling triggers temporarily
   - Using batch updates
   - Recalculating levels after bulk operations

## Alternative Patterns

If you need to frequently query:
- **All ancestors**: Consider adding a `path` column (materialized path pattern)
- **All descendants**: Consider adding a `lft`/`rgt` column (nested set pattern)
- **Tree depth**: The current `level` field handles this

For most use cases, the adjacency list pattern is sufficient and easiest to maintain.
