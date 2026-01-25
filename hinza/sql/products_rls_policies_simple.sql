-- SQL Script to Create Row-Level Security (RLS) Policies for Products Table
-- Allows superadmins and company admins to perform all operations

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
-- Step 3: Helper function to check if user is superadmin
-- ============================================
-- Superadmin is identified by having the 'companies:read' permission
-- or by being assigned to the superadmin role
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get the current authenticated user ID from JWT
  current_user_id := auth.uid();
  
  -- If no user is authenticated, deny access
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has companies:read permission (superadmin indicator)
  -- OR if user is assigned to the superadmin role
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    INNER JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    INNER JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = current_user_id
    AND (
      p.name = 'companies:read'  -- Superadmin permission
      OR ur.role_id = '00000000-0000-0000-0000-000000000002'::uuid  -- Superadmin role ID
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Step 4: Helper function to check if user has product permission
-- ============================================
CREATE OR REPLACE FUNCTION public.user_has_product_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get the current authenticated user ID from JWT
  current_user_id := auth.uid();
  
  -- If no user is authenticated, deny access
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Superadmins have all permissions
  IF public.is_superadmin() THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has the specific permission through their roles
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    INNER JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    INNER JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = current_user_id
    AND p.name = permission_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Step 5: Helper function to get user's company_id
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID AS $$
DECLARE
  current_user_id UUID;
  user_company_id UUID;
BEGIN
  -- Get the current authenticated user ID from JWT
  current_user_id := auth.uid();
  
  -- If no user is authenticated, return NULL
  IF current_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get the user's company_id
  SELECT u.company_id INTO user_company_id
  FROM public.users u
  WHERE u.id = current_user_id;
  
  RETURN user_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Step 6: SELECT Policy (READ)
-- ============================================
-- Superadmins: Can read all products
-- Company Admins: Can read products from their company
CREATE POLICY "products_select_policy" ON public.products
  FOR SELECT
  USING (
    -- Superadmins can read all products
    public.is_superadmin()
    OR
    -- Company admins can read products from their company
    (
      public.user_has_product_permission('products:read')
      AND company_id = public.get_user_company_id()
    )
  );

-- ============================================
-- Step 7: INSERT Policy (CREATE)
-- ============================================
-- Superadmins: Can create products for any company
-- Company Admins: Can create products for their company
CREATE POLICY "products_insert_policy" ON public.products
  FOR INSERT
  WITH CHECK (
    -- Superadmins can create products for any company
    public.is_superadmin()
    OR
    -- Company admins can create products for their company
    (
      public.user_has_product_permission('products:create')
      AND company_id = public.get_user_company_id()
    )
  );

-- ============================================
-- Step 8: UPDATE Policy
-- ============================================
-- Superadmins: Can update all products
-- Company Admins: Can update products from their company
CREATE POLICY "products_update_policy" ON public.products
  FOR UPDATE
  USING (
    -- Superadmins can update all products
    public.is_superadmin()
    OR
    -- Company admins can update products from their company
    (
      public.user_has_product_permission('products:update')
      AND company_id = public.get_user_company_id()
    )
  )
  WITH CHECK (
    -- Also check the new values being updated
    public.is_superadmin()
    OR
    (
      public.user_has_product_permission('products:update')
      AND company_id = public.get_user_company_id()
    )
  );

-- ============================================
-- Step 9: DELETE Policy
-- ============================================
-- Superadmins: Can delete all products
-- Company Admins: Can delete products from their company
CREATE POLICY "products_delete_policy" ON public.products
  FOR DELETE
  USING (
    -- Superadmins can delete all products
    public.is_superadmin()
    OR
    -- Company admins can delete products from their company
    (
      public.user_has_product_permission('products:delete')
      AND company_id = public.get_user_company_id()
    )
  );

-- ============================================
-- Verification Queries
-- ============================================
-- Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'products';

-- List all policies on products table
SELECT 
  policyname,
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
-- 1. Superadmins are identified by:
--    - Having 'companies:read' permission, OR
--    - Being assigned to role ID '00000000-0000-0000-0000-000000000002'
--
-- 2. Company Admins need:
--    - The appropriate product permission (products:read, products:create, etc.)
--    - Their user.company_id must match the product.company_id
--
-- 3. To grant product permissions to a company admin role:
--    INSERT INTO public.role_permissions (role_id, permission_id)
--    SELECT 
--      'role-uuid'::uuid,
--      id
--    FROM public.permissions
--    WHERE name IN ('products:read', 'products:create', 'products:update', 'products:delete');
