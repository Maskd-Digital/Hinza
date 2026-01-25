# Products Table Row-Level Security (RLS) Policies

This document explains the RLS policies for the products table and how to set them up.

## Overview

Row-Level Security (RLS) policies control who can read, create, update, and delete products at the database level. These policies check user permissions through the role-permission system.

## Prerequisites

Before applying RLS policies, ensure:

1. **Products table exists** - Run `create_products_table.sql` or `alter_products_table.sql` first
2. **Permissions exist** - The `products:read`, `products:create`, `products:update`, and `products:delete` permissions must exist in the `permissions` table
3. **Users have roles** - Users must be assigned roles via the `user_roles` table
4. **Roles have permissions** - Roles must have the product permissions assigned via `role_permissions` table

## Setup

### Step 1: Apply RLS Policies

Run the SQL script:

```sql
\i hinza/sql/products_rls_policies.sql
```

Or copy and paste the contents into your Supabase SQL editor.

### Step 2: Verify Policies

Check that RLS is enabled:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'products';
-- Should show: rowsecurity = true
```

List all policies:

```sql
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'products';
```

## How It Works

### Permission Checking

The policies use two helper functions:

1. **`user_has_permission(permission_name)`** - Checks if the authenticated user has a specific permission through their roles
2. **`get_user_company_id()`** - Gets the company_id of the authenticated user

### Policy Rules

#### SELECT (Read)
- User must have `products:read` permission
- Product must belong to user's company OR user must have `companies:read` permission

#### INSERT (Create)
- User must have `products:create` permission
- Product's `company_id` must match user's company OR user must have `companies:read` permission

#### UPDATE
- User must have `products:update` permission
- Product must belong to user's company OR user must have `companies:read` permission

#### DELETE
- User must have `products:delete` permission
- Product must belong to user's company OR user must have `companies:read` permission

## Granting Permissions

### Example: Grant Product Permissions to a Role

```sql
-- Get the role ID and permission IDs
-- Then insert into role_permissions

-- Example: Grant all product permissions to a role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  'your-role-uuid'::uuid,  -- Replace with actual role ID
  id
FROM public.permissions
WHERE name IN (
  'products:read',
  'products:create',
  'products:update',
  'products:delete'
);
```

### Example: Grant Product Permissions to Superadmin Role

```sql
-- Grant all product permissions to the superadmin role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  '00000000-0000-0000-0000-000000000002'::uuid,  -- Superadmin role ID
  id
FROM public.permissions
WHERE name IN (
  'products:read',
  'products:create',
  'products:update',
  'products:delete'
)
ON CONFLICT DO NOTHING;
```

## Testing

### Test as Regular User

1. Create a test user with a role that has `products:read` and `products:create`
2. Try to create a product for their company - should succeed
3. Try to create a product for a different company - should fail (unless they have `companies:read`)

### Test as Superadmin

1. Superadmin should have `companies:read` permission
2. Superadmin can create/read/update/delete products for any company

## Troubleshooting

### Error: "new row violates row-level security policy"

**Cause**: User doesn't have the required permission or the product's company_id doesn't match user's company.

**Solutions**:
1. Check if user has the required permission:
   ```sql
   SELECT p.name
   FROM public.permissions p
   INNER JOIN public.role_permissions rp ON p.id = rp.permission_id
   INNER JOIN public.user_roles ur ON rp.role_id = ur.role_id
   WHERE ur.user_id = 'user-uuid'::uuid
   AND p.name = 'products:create';
   ```

2. Check user's company_id:
   ```sql
   SELECT id, company_id
   FROM public.users
   WHERE id = 'user-uuid'::uuid;
   ```

3. Grant the permission to the user's role:
   ```sql
   -- First, find the user's roles
   SELECT r.id, r.name
   FROM public.roles r
   INNER JOIN public.user_roles ur ON r.id = ur.role_id
   WHERE ur.user_id = 'user-uuid'::uuid;
   
   -- Then grant permission to one of those roles
   INSERT INTO public.role_permissions (role_id, permission_id)
   VALUES (
     'role-uuid'::uuid,
     (SELECT id FROM public.permissions WHERE name = 'products:create')
   );
   ```

### Error: "function user_has_permission does not exist"

**Cause**: The helper functions weren't created.

**Solution**: Re-run the `products_rls_policies.sql` script.

### Error: "permission denied for table products"

**Cause**: RLS is enabled but no policies match, or user is not authenticated.

**Solutions**:
1. Ensure user is authenticated (has valid JWT token)
2. Check that policies exist:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'products';
   ```
3. Verify user exists in `public.users` table

## Security Notes

1. **Helper Functions**: The helper functions use `SECURITY DEFINER` to bypass RLS when checking permissions. This is necessary to avoid circular dependencies.

2. **Company Isolation**: Regular users can only access products from their own company. Only users with `companies:read` permission (typically superadmins) can access all companies.

3. **JWT Authentication**: The policies rely on `auth.uid()` to get the current user ID from the JWT token. Ensure your Supabase client is properly configured with authentication.

4. **Permission Hierarchy**: Users with `companies:read` permission can bypass company restrictions. This is intentional for superadmin users.

## Related Files

- `create_products_table.sql` - Creates the products table
- `alter_products_table.sql` - Alters existing products table
- `products_table_README.md` - Products table structure documentation
- `recreate_permissions_table.sql` - Creates permissions table
- `seed_permissions_and_superadmin.sql` - Seeds permissions and creates superadmin role
