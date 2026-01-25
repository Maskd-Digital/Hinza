-- SQL Script to Create Superadmin User
-- This script assumes the user already exists in Supabase Auth (auth.users table)
-- Replace the placeholders with actual values

-- Step 1: Create a system company for superadmin (if it doesn't exist)
-- You can skip this if you want to use an existing company
INSERT INTO public.companies (id, name, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid, -- System company ID
  'System',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create Superadmin role (if it doesn't exist)
INSERT INTO public.roles (id, company_id, name)
VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid, -- Superadmin role ID
  '00000000-0000-0000-0000-000000000001'::uuid, -- System company ID
  'Superadmin'
)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Assign ALL permissions to Superadmin role
-- This assigns every permission in the permissions table to the superadmin role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  '00000000-0000-0000-0000-000000000002'::uuid AS role_id,
  id AS permission_id
FROM public.permissions
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.role_permissions 
  WHERE role_id = '00000000-0000-0000-0000-000000000002'::uuid 
    AND permission_id = permissions.id
);

-- Step 4: Insert the user into users table
-- Replace 'YOUR_AUTH_USER_ID' with the actual UUID from auth.users
-- Replace 'YOUR_EMAIL' and 'YOUR_FULL_NAME' with actual values
INSERT INTO public.users (id, company_id, full_name, email, is_active)
VALUES (
  'YOUR_AUTH_USER_ID'::uuid, -- This must match the id in auth.users
  '00000000-0000-0000-0000-000000000001'::uuid, -- System company ID
  'YOUR_FULL_NAME', -- e.g., 'Super Admin'
  'YOUR_EMAIL', -- e.g., 'admin@example.com'
  true
)
ON CONFLICT (id) DO UPDATE
SET 
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  is_active = EXCLUDED.is_active;

-- Step 5: Assign Superadmin role to the user
INSERT INTO public.user_roles (user_id, role_id)
VALUES (
  'YOUR_AUTH_USER_ID'::uuid, -- Same as above
  '00000000-0000-0000-0000-000000000002'::uuid -- Superadmin role ID
)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ============================================
-- ALTERNATIVE: If you want superadmin to belong to a specific company
-- ============================================
-- Replace 'YOUR_COMPANY_ID' with an actual company UUID

/*
-- Create Superadmin role for a specific company
INSERT INTO public.roles (id, company_id, name)
VALUES (
  gen_random_uuid(), -- Or use a fixed UUID
  'YOUR_COMPANY_ID'::uuid,
  'Superadmin'
)
ON CONFLICT DO NOTHING;

-- Assign all permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'Superadmin' AND company_id = 'YOUR_COMPANY_ID'::uuid),
  id
FROM public.permissions
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.role_permissions rp
  JOIN public.roles r ON rp.role_id = r.id
  WHERE r.name = 'Superadmin' 
    AND r.company_id = 'YOUR_COMPANY_ID'::uuid
    AND rp.permission_id = permissions.id
);

-- Insert user
INSERT INTO public.users (id, company_id, full_name, email, is_active)
VALUES (
  'YOUR_AUTH_USER_ID'::uuid,
  'YOUR_COMPANY_ID'::uuid,
  'YOUR_FULL_NAME',
  'YOUR_EMAIL',
  true
)
ON CONFLICT (id) DO UPDATE
SET 
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  is_active = EXCLUDED.is_active;

-- Assign role
INSERT INTO public.user_roles (user_id, role_id)
SELECT 
  'YOUR_AUTH_USER_ID'::uuid,
  id
FROM public.roles
WHERE name = 'Superadmin' AND company_id = 'YOUR_COMPANY_ID'::uuid
ON CONFLICT (user_id, role_id) DO NOTHING;
*/

-- ============================================
-- HELPER QUERIES
-- ============================================

-- To find a user's auth ID from Supabase Auth:
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- To verify the superadmin was created correctly:
-- SELECT 
--   u.id,
--   u.email,
--   u.full_name,
--   r.name AS role_name,
--   COUNT(DISTINCT rp.permission_id) AS permission_count
-- FROM users u
-- JOIN user_roles ur ON u.id = ur.user_id
-- JOIN roles r ON ur.role_id = r.id
-- JOIN role_permissions rp ON r.id = rp.role_id
-- WHERE u.email = 'YOUR_EMAIL'
-- GROUP BY u.id, u.email, u.full_name, r.name;
