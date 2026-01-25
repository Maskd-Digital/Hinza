-- Helper SQL Queries for Superadmin Setup

-- ============================================
-- 1. Find Auth User ID by Email
-- ============================================
-- Use this to get the UUID of a user from Supabase Auth
SELECT 
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'your-email@example.com';

-- ============================================
-- 2. Check if Permissions Table is Populated
-- ============================================
SELECT 
  id,
  name,
  description
FROM public.permissions
ORDER BY name;

-- If this returns empty, you need to seed the permissions first
-- See DATABASE_SCHEMA_ALIGNMENT.md for the permissions INSERT statements

-- ============================================
-- 3. Verify Superadmin Setup
-- ============================================
-- Run this after creating a superadmin to verify everything is set up correctly
SELECT 
  u.id AS user_id,
  u.email,
  u.full_name,
  u.company_id,
  c.name AS company_name,
  r.id AS role_id,
  r.name AS role_name,
  COUNT(DISTINCT rp.permission_id) AS total_permissions,
  COUNT(DISTINCT p.id) AS available_permissions
FROM public.users u
LEFT JOIN public.companies c ON u.company_id = c.id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.roles r ON ur.role_id = r.id
LEFT JOIN public.role_permissions rp ON r.id = rp.role_id
LEFT JOIN public.permissions p ON rp.permission_id = p.id
WHERE u.email = 'your-email@example.com' -- Replace with your email
GROUP BY u.id, u.email, u.full_name, u.company_id, c.name, r.id, r.name;

-- ============================================
-- 4. List All Users with Their Roles and Permissions
-- ============================================
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.is_active,
  c.name AS company_name,
  STRING_AGG(DISTINCT r.name, ', ') AS roles,
  COUNT(DISTINCT rp.permission_id) AS permission_count
FROM public.users u
LEFT JOIN public.companies c ON u.company_id = c.id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.roles r ON ur.role_id = r.id
LEFT JOIN public.role_permissions rp ON r.id = rp.role_id
GROUP BY u.id, u.email, u.full_name, u.is_active, c.name
ORDER BY u.email;

-- ============================================
-- 5. Check All Permissions Assigned to a Role
-- ============================================
SELECT 
  r.name AS role_name,
  p.name AS permission_name,
  p.description
FROM public.roles r
JOIN public.role_permissions rp ON r.id = rp.role_id
JOIN public.permissions p ON rp.permission_id = p.id
WHERE r.name = 'Superadmin' -- Or any role name
ORDER BY p.name;

-- ============================================
-- 6. Create Superadmin for Existing Company
-- ============================================
-- Use this if you want to create a superadmin for an existing company
-- Replace 'YOUR_COMPANY_ID' and 'YOUR_AUTH_USER_ID' with actual values

/*
DO $$
DECLARE
  v_role_id uuid;
  v_company_id uuid := 'YOUR_COMPANY_ID'::uuid;
  v_user_id uuid := 'YOUR_AUTH_USER_ID'::uuid;
BEGIN
  -- Create or get Superadmin role
  INSERT INTO public.roles (id, company_id, name)
  VALUES (gen_random_uuid(), v_company_id, 'Superadmin')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_role_id;
  
  -- If role already exists, get its ID
  IF v_role_id IS NULL THEN
    SELECT id INTO v_role_id FROM public.roles 
    WHERE name = 'Superadmin' AND company_id = v_company_id;
  END IF;
  
  -- Assign all permissions to the role
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_role_id, id
  FROM public.permissions
  WHERE NOT EXISTS (
    SELECT 1 FROM public.role_permissions 
    WHERE role_id = v_role_id AND permission_id = permissions.id
  );
  
  -- Create user record
  INSERT INTO public.users (id, company_id, full_name, email, is_active)
  VALUES (v_user_id, v_company_id, 'Super Admin', 'admin@example.com', true)
  ON CONFLICT (id) DO UPDATE
  SET company_id = EXCLUDED.company_id,
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      is_active = EXCLUDED.is_active;
  
  -- Assign role to user
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (v_user_id, v_role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;
  
  RAISE NOTICE 'Superadmin created successfully. Role ID: %, User ID: %', v_role_id, v_user_id;
END $$;
*/
