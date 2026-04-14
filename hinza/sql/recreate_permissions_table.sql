-- SQL to Drop and Recreate Permissions Table
-- This will recreate the permissions table with all superadmin permissions

-- Step 1: Drop existing permissions table (CASCADE to handle foreign key constraints)
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;

-- Step 2: Recreate permissions table
CREATE TABLE public.permissions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

-- Step 3: Insert all permissions
-- Company Management Permissions
INSERT INTO public.permissions (name, description) VALUES
('companies:read', 'View companies'),
('companies:create', 'Create new companies'),
('companies:update', 'Update company information'),
('companies:delete', 'Delete companies');

-- User Management Permissions
INSERT INTO public.permissions (name, description) VALUES
('users:read', 'View users'),
('users:create', 'Create/invite new users'),
('users:update', 'Update user information and roles'),
('users:delete', 'Delete/deactivate users');

-- Complaint Management Permissions
INSERT INTO public.permissions (name, description) VALUES
('complaints:read', 'View complaints'),
('complaints:create', 'Create new complaints'),
('complaints:update', 'Update complaint information'),
('complaints:assign', 'Assign complaints to users'),
('complaints:resolve', 'Resolve complaints');

-- Facility Management Permissions
INSERT INTO public.permissions (name, description) VALUES
('facilities:read', 'View facilities'),
('facilities:create', 'Create new facilities'),
('facilities:update', 'Update facility information'),
('facilities:delete', 'Delete facilities');

-- Complaint Template Management Permissions
INSERT INTO public.permissions (name, description) VALUES
('templates:read', 'View complaint templates'),
('templates:create', 'Create new complaint templates'),
('templates:update', 'Update complaint templates'),
('templates:delete', 'Delete complaint templates');

-- Product Management Permissions
INSERT INTO public.permissions (name, description) VALUES
('products:read', 'View products'),
('products:create', 'Create new products'),
('products:update', 'Update product information'),
('products:delete', 'Delete products');

-- Batch Management Permissions
INSERT INTO public.permissions (name, description) VALUES
('batches:read', 'View batches'),
('batches:create', 'Create new batches'),
('batches:update', 'Update batch information'),
('batches:delete', 'Delete batches');

-- Reports & Analytics Permissions
INSERT INTO public.permissions (name, description) VALUES
('reports:read', 'View reports and analytics'),
('reports:export', 'Export reports (CSV/PDF)');

-- Audit & Logging Permissions
INSERT INTO public.permissions (name, description) VALUES
('audit:read', 'View audit logs');

-- Role Management Permissions
INSERT INTO public.permissions (name, description) VALUES
('roles:read', 'View roles'),
('roles:create', 'Create new roles'),
('roles:update', 'Update role information and permissions'),
('roles:delete', 'Delete roles');

-- Dashboard Permissions
INSERT INTO public.permissions (name, description) VALUES
('dashboard:view', 'View dashboard');

-- Facility equipment & facility manager workflow
INSERT INTO public.permissions (name, description) VALUES
('facility_equipment:read', 'View facility equipment registry'),
('facility_equipment:create', 'Create facility equipment records'),
('facility_equipment:update', 'Update facility equipment records'),
('facility_equipment:delete', 'Delete facility equipment records'),
('facility_managers:assign', 'Assign facility managers to facilities'),
('facility_complaints:create', 'Create facility equipment complaints'),
('facility_complaints:read', 'View facility equipment complaints for assigned facilities'),
('facility_complaints:escalate', 'Escalate facility equipment complaints to QA');

-- Step 4: Recreate role_permissions table
CREATE TABLE public.role_permissions (
  role_id UUID NOT NULL,
  permission_id INTEGER NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE
);

-- Step 5: Verify permissions were created
SELECT 
  id,
  name,
  description
FROM public.permissions
ORDER BY name;

-- Expected: 45 permissions total
