-- SQL Script to Seed Permissions and Create Superadmin Role
-- This script creates all necessary permissions and assigns them to a superadmin role

-- ============================================
-- Step 1: Insert Permissions
-- ============================================

-- Company Management Permissions
INSERT INTO public.permissions (name, description) VALUES
('companies:read', 'View companies'),
('companies:create', 'Create new companies'),
('companies:update', 'Update company information'),
('companies:delete', 'Delete companies')
ON CONFLICT (name) DO NOTHING;

-- User Management Permissions
INSERT INTO public.permissions (name, description) VALUES
('users:read', 'View users'),
('users:create', 'Create/invite new users'),
('users:update', 'Update user information and roles'),
('users:delete', 'Delete/deactivate users')
ON CONFLICT (name) DO NOTHING;

-- Complaint Management Permissions
INSERT INTO public.permissions (name, description) VALUES
('complaints:read', 'View complaints'),
('complaints:create', 'Create new complaints'),
('complaints:update', 'Update complaint information'),
('complaints:assign', 'Assign complaints to users'),
('complaints:resolve', 'Resolve complaints')
ON CONFLICT (name) DO NOTHING;

-- Facility Management Permissions
INSERT INTO public.permissions (name, description) VALUES
('facilities:read', 'View facilities'),
('facilities:create', 'Create new facilities'),
('facilities:update', 'Update facility information'),
('facilities:delete', 'Delete facilities')
ON CONFLICT (name) DO NOTHING;

-- Complaint Template Management Permissions
INSERT INTO public.permissions (name, description) VALUES
('templates:read', 'View complaint templates'),
('templates:create', 'Create new complaint templates'),
('templates:update', 'Update complaint templates'),
('templates:delete', 'Delete complaint templates')
ON CONFLICT (name) DO NOTHING;

-- Product Management Permissions
INSERT INTO public.permissions (name, description) VALUES
('products:read', 'View products'),
('products:create', 'Create new products'),
('products:update', 'Update product information'),
('products:delete', 'Delete products')
ON CONFLICT (name) DO NOTHING;

-- Batch Management Permissions
INSERT INTO public.permissions (name, description) VALUES
('batches:read', 'View batches'),
('batches:create', 'Create new batches'),
('batches:update', 'Update batch information'),
('batches:delete', 'Delete batches')
ON CONFLICT (name) DO NOTHING;

-- Reports & Analytics Permissions
INSERT INTO public.permissions (name, description) VALUES
('reports:read', 'View reports and analytics'),
('reports:export', 'Export reports (CSV/PDF)')
ON CONFLICT (name) DO NOTHING;

-- Audit & Logging Permissions
INSERT INTO public.permissions (name, description) VALUES
('audit:read', 'View audit logs')
ON CONFLICT (name) DO NOTHING;

-- Role Management Permissions
INSERT INTO public.permissions (name, description) VALUES
('roles:read', 'View roles'),
('roles:create', 'Create new roles'),
('roles:update', 'Update role information and permissions'),
('roles:delete', 'Delete roles')
ON CONFLICT (name) DO NOTHING;

-- Dashboard Permissions
INSERT INTO public.permissions (name, description) VALUES
('dashboard:view', 'View dashboard')
ON CONFLICT (name) DO NOTHING;

-- Facility equipment & facility manager workflow
INSERT INTO public.permissions (name, description) VALUES
('facility_equipment:read', 'View facility equipment registry'),
('facility_equipment:create', 'Create facility equipment records'),
('facility_equipment:update', 'Update facility equipment records'),
('facility_equipment:delete', 'Delete facility equipment records'),
('facility_managers:assign', 'Assign facility managers to facilities'),
('facility_complaints:create', 'Create facility equipment complaints'),
('facility_complaints:read', 'View facility equipment complaints for assigned facilities'),
('facility_complaints:escalate', 'Escalate facility equipment complaints to QA')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- Step 2: Create System Company (if needed)
-- ============================================
-- This is for superadmin users who need a company_id
INSERT INTO public.companies (id, name, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'System',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Step 3: Create Superadmin Role
-- ============================================
INSERT INTO public.roles (id, company_id, name)
VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Superadmin'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Step 4: Assign ALL Permissions to Superadmin Role
-- ============================================
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

-- ============================================
-- Verification Queries
-- ============================================

-- Check all permissions created
SELECT 
  id,
  name,
  description
FROM public.permissions
ORDER BY name;

-- Check superadmin role and its permissions
SELECT 
  r.id AS role_id,
  r.name AS role_name,
  r.company_id,
  c.name AS company_name,
  COUNT(rp.permission_id) AS total_permissions
FROM public.roles r
LEFT JOIN public.companies c ON r.company_id = c.id
LEFT JOIN public.role_permissions rp ON r.id = rp.role_id
WHERE r.name = 'Superadmin'
GROUP BY r.id, r.name, r.company_id, c.name;

-- List all permissions assigned to Superadmin
SELECT 
  p.id,
  p.name,
  p.description
FROM public.permissions p
JOIN public.role_permissions rp ON p.id = rp.permission_id
JOIN public.roles r ON rp.role_id = r.id
WHERE r.name = 'Superadmin'
ORDER BY p.name;

-- ============================================
-- Summary
-- ============================================
-- This script creates:
-- 1. 35+ permissions covering all major features
-- 2. A System company for superadmin users
-- 3. A Superadmin role
-- 4. Assigns all permissions to the Superadmin role
--
-- Total permissions created:
-- - Company: 4 permissions
-- - User: 4 permissions
-- - Complaint: 5 permissions
-- - Facility: 4 permissions
-- - Template: 4 permissions
-- - Product: 4 permissions
-- - Batch: 4 permissions
-- - Reports: 2 permissions
-- - Audit: 1 permission
-- - Roles: 4 permissions
-- - Dashboard: 1 permission
-- Total: 45 permissions (37 + 8 facility equipment / facility complaint permissions)
