-- Quick Superadmin Setup Script
-- Simple version - just replace the user_id and run

-- Replace 'YOUR_USER_ID_HERE' with the UUID from auth.users
-- To find your user ID: SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Step 1: Create Superadmin role (using System company)
INSERT INTO public.roles (id, company_id, name)
VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid, -- Fixed UUID for Superadmin role
  '00000000-0000-0000-0000-000000000001'::uuid, -- System company ID
  'Superadmin'
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Assign ALL permissions to Superadmin role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  '00000000-0000-0000-0000-000000000002'::uuid,
  id
FROM public.permissions
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.role_permissions 
  WHERE role_id = '00000000-0000-0000-0000-000000000002'::uuid 
    AND permission_id = permissions.id
);

-- Step 3: Assign Superadmin role to your user
-- REPLACE 'YOUR_USER_ID_HERE' with your actual user UUID
INSERT INTO public.user_roles (user_id, role_id)
VALUES (
  'YOUR_USER_ID_HERE'::uuid, -- <-- REPLACE THIS
  '00000000-0000-0000-0000-000000000002'::uuid
)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Step 4: Update user's primary_role (if column exists)
-- This step is optional - only runs if primary_role column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'primary_role'
  ) THEN
    UPDATE public.users
    SET primary_role = 'Superadmin'
    WHERE id = 'YOUR_USER_ID_HERE'::uuid; -- <-- REPLACE THIS
  END IF;
END $$;

-- Verification: Check your user's roles and permissions
SELECT 
  u.email,
  u.full_name,
  r.name AS role_name,
  COUNT(DISTINCT rp.permission_id) AS total_permissions
FROM public.users u
JOIN public.user_roles ur ON u.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
LEFT JOIN public.role_permissions rp ON r.id = rp.role_id
WHERE u.id = 'YOUR_USER_ID_HERE'::uuid -- <-- REPLACE THIS
GROUP BY u.email, u.full_name, r.name;
