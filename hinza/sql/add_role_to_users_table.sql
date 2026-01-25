-- SQL to add role column to users table for easier role identification
-- This adds a denormalized role field for quick lookups

-- Option 1: Add a simple text column for primary role name
-- This stores the role name directly (e.g., 'Superadmin', 'Company Admin', etc.)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS primary_role text;

-- Option 2: Add a UUID column that references roles table
-- This maintains referential integrity but requires a join to get the name
-- ALTER TABLE public.users
-- ADD COLUMN IF NOT EXISTS primary_role_id uuid REFERENCES public.roles(id);

-- Populate the primary_role column from existing user_roles data
-- This takes the first role (alphabetically by role name) as the primary role
UPDATE public.users u
SET primary_role = (
  SELECT r.name
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = u.id
  ORDER BY r.name
  LIMIT 1
)
WHERE primary_role IS NULL;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_primary_role ON public.users(primary_role);

-- Optional: Create a function to automatically update primary_role when user_roles change
-- This keeps the denormalized data in sync
CREATE OR REPLACE FUNCTION update_user_primary_role()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET primary_role = (
    SELECT r.name
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = NEW.user_id
    ORDER BY r.name
    LIMIT 1
  )
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update primary_role when user_roles are inserted
CREATE TRIGGER trigger_update_primary_role_on_insert
AFTER INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION update_user_primary_role();

-- Create trigger to update primary_role when user_roles are deleted
CREATE TRIGGER trigger_update_primary_role_on_delete
AFTER DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION update_user_primary_role();

-- ============================================
-- Alternative: If you want to store ALL roles as an array
-- ============================================
-- This allows storing multiple role names in a single column
/*
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS role_names text[];

UPDATE public.users u
SET role_names = (
  SELECT ARRAY_AGG(r.name ORDER BY r.name)
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = u.id
);

CREATE INDEX IF NOT EXISTS idx_users_role_names ON public.users USING GIN(role_names);

-- Function to update role_names array
CREATE OR REPLACE FUNCTION update_user_role_names()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET role_names = (
    SELECT ARRAY_AGG(r.name ORDER BY r.name)
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = COALESCE(NEW.user_id, OLD.user_id)
  )
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_role_names_on_insert
AFTER INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION update_user_role_names();

CREATE TRIGGER trigger_update_role_names_on_delete
AFTER DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION update_user_role_names();
*/

-- ============================================
-- Verification Queries
-- ============================================

-- Check users with their primary role
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.primary_role,
  COUNT(ur.role_id) as total_roles
FROM public.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
GROUP BY u.id, u.email, u.full_name, u.primary_role
ORDER BY u.email;

-- Check if any users don't have a primary role set
SELECT 
  u.id,
  u.email,
  u.full_name
FROM public.users u
WHERE u.primary_role IS NULL
  AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id);
