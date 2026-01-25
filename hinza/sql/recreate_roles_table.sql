-- SQL to Drop and Recreate Roles Table with Company Isolation
-- This ensures roles are company-specific and linked to permissions

-- Step 1: Drop existing tables (in order to handle foreign key constraints)
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- Step 2: Recreate roles table with company isolation
CREATE TABLE public.roles (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  CONSTRAINT roles_pkey PRIMARY KEY (id),
  CONSTRAINT fk_roles_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE
);

-- Step 3: Create unique constraint to prevent duplicate role names within the same company
-- This ensures each company can have their own "Admin" role, but not duplicate names
CREATE UNIQUE INDEX idx_roles_company_name ON public.roles(company_id, name);

-- Step 4: Recreate role_permissions junction table
-- This links roles to permissions (many-to-many relationship)
CREATE TABLE public.role_permissions (
  role_id UUID NOT NULL,
  permission_id INTEGER NOT NULL,
  CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE
);

-- Step 5: Recreate user_roles junction table
-- This links users to roles (many-to-many relationship)
CREATE TABLE public.user_roles (
  user_id UUID NOT NULL,
  role_id UUID NOT NULL,
  CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE
);

-- Step 6: Create indexes for better query performance
CREATE INDEX idx_roles_company_id ON public.roles(company_id);
CREATE INDEX idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON public.user_roles(role_id);

-- ============================================
-- Verification Queries
-- ============================================

-- Check roles table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'roles'
ORDER BY ordinal_position;

-- Check role_permissions table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'role_permissions'
ORDER BY ordinal_position;

-- Check user_roles table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_roles'
ORDER BY ordinal_position;

-- ============================================
-- Example: Create a role for a company
-- ============================================
/*
-- Example: Create "Company Admin" role for a specific company
INSERT INTO public.roles (company_id, name)
VALUES (
  'your-company-uuid-here'::uuid,
  'Company Admin'
)
RETURNING id;

-- Then assign permissions to this role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'Company Admin' AND company_id = 'your-company-uuid-here'::uuid),
  id
FROM public.permissions
WHERE name IN (
  'users:read',
  'users:create',
  'users:update',
  'users:delete',
  'complaints:read',
  'complaints:create',
  'complaints:update',
  'complaints:assign',
  'facilities:read',
  'facilities:create',
  'facilities:update',
  'templates:read',
  'templates:create',
  'templates:update',
  'reports:read'
);
*/

-- ============================================
-- Summary
-- ============================================
-- This script creates:
-- 1. roles table: id, company_id, name (with company isolation)
-- 2. role_permissions table: links roles to permissions
-- 3. user_roles table: links users to roles
-- 4. Proper foreign key constraints with CASCADE delete
-- 5. Unique constraint: prevents duplicate role names within same company
-- 6. Indexes for better query performance
--
-- Company Isolation:
-- - Each role belongs to a specific company (company_id)
-- - Companies can have their own roles with the same name (e.g., "Admin" in Company A vs Company B)
-- - Role permissions are isolated per company through the role's company_id
