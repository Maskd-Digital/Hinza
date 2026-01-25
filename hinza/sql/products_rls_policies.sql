-- SQL Script to Create Row-Level Security (RLS) Policies for Products Table
-- This enables RLS and creates policies that check user permissions through roles

-- ============================================
-- Step 1: Enable Row Level Security on products table
-- ============================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Step 2: Drop existing policies if they exist (for idempotency)
-- ============================================
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
DROP POLICY IF EXISTS "products_insert_policy" ON public.products;
DROP POLICY IF EXISTS "products_update_policy" ON public.products;
DROP POLICY IF EXISTS "products_delete_policy" ON public.products;

-- ============================================
-- Step 3: Helper function to check if user has a specific permission
-- ============================================
-- This function checks if the current authenticated user has a specific permission
-- through their roles
CREATE OR REPLACE FUNCTION public.user_has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_id UUID;
  permission_id INTEGER;
BEGIN
  -- Get the current authenticated user ID from JWT
  user_id := auth.uid();
  
  -- If no user is authenticated, deny access
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get the permission ID
  SELECT id INTO permission_id
  FROM public.permissions
  WHERE name = permission_name;
  
  -- If permission doesn't exist, deny access
  IF permission_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has this permission through any of their roles
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    INNER JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    WHERE ur.user_id = user_id
    AND rp.permission_id = permission_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Step 4: Helper function to get user's company_id
-- ============================================
-- This function gets the company_id of the current authenticated user
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID AS $$
DECLARE
  user_id UUID;
  company_id_result UUID;
BEGIN
  -- Get the current authenticated user ID from JWT
  user_id := auth.uid();
  
  -- If no user is authenticated, return NULL
  IF user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get the user's company_id
  SELECT company_id INTO company_id_result
  FROM public.users
  WHERE id = user_id;
  
  RETURN company_id_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Step 5: SELECT Policy (READ)
-- ============================================
-- Users can read products if:
-- 1. They have 'products:read' permission AND
-- 2. The product belongs to their company (or they have 'companies:read' for all companies)
CREATE POLICY "products_select_policy" ON public.products
  FOR SELECT
  USING (
    -- Check if user has products:read permission
    public.user_has_permission('products:read') AND (
      -- Allow if product belongs to user's company
      company_id = public.get_user_company_id()
      OR
      -- Allow if user has companies:read permission (can see all companies)
      public.user_has_permission('companies:read')
    )
  );

-- ============================================
-- Step 6: INSERT Policy (CREATE)
-- ============================================
-- Users can create products if:
-- 1. They have 'products:create' permission AND
-- 2. The product's company_id matches their company_id (or they have 'companies:read' for all companies)
CREATE POLICY "products_insert_policy" ON public.products
  FOR INSERT
  WITH CHECK (
    -- Check if user has products:create permission
    public.user_has_permission('products:create') AND (
      -- Allow if product belongs to user's company
      company_id = public.get_user_company_id()
      OR
      -- Allow if user has companies:read permission (can create for all companies)
      public.user_has_permission('companies:read')
    )
  );

-- ============================================
-- Step 7: UPDATE Policy
-- ============================================
-- Users can update products if:
-- 1. They have 'products:update' permission AND
-- 2. The product belongs to their company (or they have 'companies:read' for all companies)
CREATE POLICY "products_update_policy" ON public.products
  FOR UPDATE
  USING (
    -- Check if user has products:update permission
    public.user_has_permission('products:update') AND (
      -- Allow if product belongs to user's company
      company_id = public.get_user_company_id()
      OR
      -- Allow if user has companies:read permission (can update for all companies)
      public.user_has_permission('companies:read')
    )
  )
  WITH CHECK (
    -- Also check the new values being updated
    public.user_has_permission('products:update') AND (
      company_id = public.get_user_company_id()
      OR
      public.user_has_permission('companies:read')
    )
  );

-- ============================================
-- Step 8: DELETE Policy
-- ============================================
-- Users can delete products if:
-- 1. They have 'products:delete' permission AND
-- 2. The product belongs to their company (or they have 'companies:read' for all companies)
CREATE POLICY "products_delete_policy" ON public.products
  FOR DELETE
  USING (
    -- Check if user has products:delete permission
    public.user_has_permission('products:delete') AND (
      -- Allow if product belongs to user's company
      company_id = public.get_user_company_id()
      OR
      -- Allow if user has companies:read permission (can delete for all companies)
      public.user_has_permission('companies:read')
    )
  );

-- ============================================
-- Verification Queries
-- ============================================
-- Run these to verify the policies were created:

-- Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'products';

-- List all policies on products table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'products'
ORDER BY policyname;

-- ============================================
-- Notes
-- ============================================
-- 1. These policies require that:
--    - Users are authenticated (have a valid JWT token)
--    - Users exist in the public.users table
--    - Users have roles assigned via user_roles table
--    - Roles have permissions assigned via role_permissions table
--
-- 2. The policies enforce company isolation:
--    - Regular users can only access products from their own company
--    - Users with 'companies:read' permission (typically superadmins) can access all companies
--
-- 3. To grant a user permission to create products:
--    - Assign them a role that has the 'products:create' permission
--    - Example:
--      INSERT INTO public.role_permissions (role_id, permission_id)
--      SELECT 
--        'role-uuid'::uuid,
--        (SELECT id FROM public.permissions WHERE name = 'products:create');
--
-- 4. The helper functions use SECURITY DEFINER to bypass RLS when checking permissions,
--    which is necessary to avoid circular dependencies.
