-- SQL Script to Grant Product Permissions to Roles
-- This script grants all product management permissions to specified roles

-- ============================================
-- Option 1: Grant to Superadmin Role
-- ============================================
-- This grants all product permissions to the superadmin role
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
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- Option 2: Grant to a Specific Role by Name
-- ============================================
-- Replace 'Company Admin' with your role name
-- Uncomment and modify as needed:
/*
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Company Admin'  -- Change this to your role name
AND p.name IN (
  'products:read',
  'products:create',
  'products:update',
  'products:delete'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;
*/

-- ============================================
-- Option 3: Grant to a Specific Role by ID
-- ============================================
-- Replace 'your-role-uuid' with your actual role UUID
-- Uncomment and modify as needed:
/*
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  'your-role-uuid'::uuid,  -- Replace with your role UUID
  id
FROM public.permissions
WHERE name IN (
  'products:read',
  'products:create',
  'products:update',
  'products:delete'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;
*/

-- ============================================
-- Option 4: Grant to All Roles for a Company
-- ============================================
-- This grants product permissions to all roles for a specific company
-- Replace 'your-company-uuid' with your company UUID
-- Uncomment and modify as needed:
/*
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.company_id = 'your-company-uuid'::uuid  -- Replace with your company UUID
AND p.name IN (
  'products:read',
  'products:create',
  'products:update',
  'products:delete'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;
*/

-- ============================================
-- Verification
-- ============================================
-- Check if permissions were granted to superadmin role
SELECT 
  r.name AS role_name,
  p.name AS permission_name
FROM public.roles r
INNER JOIN public.role_permissions rp ON r.id = rp.role_id
INNER JOIN public.permissions p ON rp.permission_id = p.id
WHERE r.id = '00000000-0000-0000-0000-000000000002'::uuid
AND p.name LIKE 'products:%'
ORDER BY p.name;

-- Check all roles with product permissions
SELECT 
  r.name AS role_name,
  r.company_id,
  STRING_AGG(p.name, ', ' ORDER BY p.name) AS product_permissions
FROM public.roles r
INNER JOIN public.role_permissions rp ON r.id = rp.role_id
INNER JOIN public.permissions p ON rp.permission_id = p.id
WHERE p.name LIKE 'products:%'
GROUP BY r.id, r.name, r.company_id
ORDER BY r.name;
