-- SQL to Create Superadmin Role, Attach All Permissions, and Assign to User
-- Replace the placeholders with your actual values

-- ============================================
-- Step 1: Set Variables (Replace these with your values)
-- ============================================
-- Option A: Use System Company (for system-wide superadmin)
DO $$
DECLARE
  v_company_id uuid := '00000000-0000-0000-0000-000000000001'::uuid; -- System company
  v_user_id uuid := 'YOUR_USER_ID_HERE'::uuid; -- Replace with your user's UUID from auth.users
  v_role_id uuid;
BEGIN
  -- ============================================
  -- Step 2: Create Superadmin Role
  -- ============================================
  INSERT INTO public.roles (id, company_id, name)
  VALUES (
    gen_random_uuid(), -- Or use a fixed UUID if you prefer
    v_company_id,
    'Superadmin'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_role_id;
  
  -- If role already exists, get its ID
  IF v_role_id IS NULL THEN
    SELECT id INTO v_role_id 
    FROM public.roles 
    WHERE name = 'Superadmin' 
      AND company_id = v_company_id
    LIMIT 1;
  END IF;
  
  -- ============================================
  -- Step 3: Assign ALL Permissions to Superadmin Role
  -- ============================================
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT 
    v_role_id,
    id
  FROM public.permissions
  WHERE NOT EXISTS (
    SELECT 1 
    FROM public.role_permissions 
    WHERE role_id = v_role_id 
      AND permission_id = permissions.id
  );
  
  -- ============================================
  -- Step 4: Assign Superadmin Role to User
  -- ============================================
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (v_user_id, v_role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;
  
  -- ============================================
  -- Step 5: Update user's primary_role (if column exists)
  -- ============================================
  -- Only update if primary_role column exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'primary_role'
  ) THEN
    UPDATE public.users
    SET primary_role = 'Superadmin'
    WHERE id = v_user_id;
  END IF;
  
  RAISE NOTICE 'Superadmin role created and assigned successfully!';
  RAISE NOTICE 'Role ID: %', v_role_id;
  RAISE NOTICE 'User ID: %', v_user_id;
END $$;

-- ============================================
-- ALTERNATIVE: For a specific company
-- ============================================
-- If you want to create superadmin for a specific company instead:
/*
DO $$
DECLARE
  v_company_id uuid := 'YOUR_COMPANY_ID_HERE'::uuid; -- Replace with actual company UUID
  v_user_id uuid := 'YOUR_USER_ID_HERE'::uuid; -- Replace with your user's UUID
  v_role_id uuid;
BEGIN
  -- Create Superadmin role for the company
  INSERT INTO public.roles (id, company_id, name)
  VALUES (gen_random_uuid(), v_company_id, 'Superadmin')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_role_id;
  
  IF v_role_id IS NULL THEN
    SELECT id INTO v_role_id 
    FROM public.roles 
    WHERE name = 'Superadmin' 
      AND company_id = v_company_id
    LIMIT 1;
  END IF;
  
  -- Assign all permissions
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_role_id, id
  FROM public.permissions
  WHERE NOT EXISTS (
    SELECT 1 FROM public.role_permissions 
    WHERE role_id = v_role_id AND permission_id = permissions.id
  );
  
  -- Assign role to user
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (v_user_id, v_role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;
  
  -- Update primary_role (if column exists)
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'primary_role'
  ) THEN
    UPDATE public.users
    SET primary_role = 'Superadmin'
    WHERE id = v_user_id;
  END IF;
  
  RAISE NOTICE 'Superadmin role created for company and assigned successfully!';
END $$;
*/

-- ============================================
-- Verification Queries
-- ============================================

-- Check if role was created
SELECT 
  r.id,
  r.name,
  r.company_id,
  c.name AS company_name,
  COUNT(rp.permission_id) AS total_permissions
FROM public.roles r
LEFT JOIN public.companies c ON r.company_id = c.id
LEFT JOIN public.role_permissions rp ON r.id = rp.role_id
WHERE r.name = 'Superadmin'
GROUP BY r.id, r.name, r.company_id, c.name;

-- Check if role is assigned to user
SELECT 
  u.id AS user_id,
  u.email,
  u.full_name,
  r.name AS role_name,
  COUNT(rp.permission_id) AS permission_count
FROM public.users u
JOIN public.user_roles ur ON u.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
LEFT JOIN public.role_permissions rp ON r.id = rp.role_id
WHERE u.id = 'YOUR_USER_ID_HERE'::uuid -- Replace with your user ID
  AND r.name = 'Superadmin'
GROUP BY u.id, u.email, u.full_name, r.name;

-- List all permissions assigned to the superadmin role
SELECT 
  p.id,
  p.name,
  p.description
FROM public.permissions p
JOIN public.role_permissions rp ON p.id = rp.permission_id
JOIN public.roles r ON rp.role_id = r.id
WHERE r.name = 'Superadmin'
ORDER BY p.name;
