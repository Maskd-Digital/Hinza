-- ============================================================================
-- Facilities Table Creation Script
-- ============================================================================
-- This script creates the facilities table for managing company facilities/locations
-- Facilities can be physical locations, departments, or operational units
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Step 1: Create the facilities table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    phone TEXT,
    email TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique facility names per company
    CONSTRAINT facilities_company_name_unique UNIQUE (company_id, name)
);

-- ============================================================================
-- Step 2: Create indexes for better query performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_facilities_company_id ON public.facilities(company_id);
CREATE INDEX IF NOT EXISTS idx_facilities_is_active ON public.facilities(is_active);
CREATE INDEX IF NOT EXISTS idx_facilities_name ON public.facilities(name);

-- ============================================================================
-- Step 3: Create updated_at trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION update_facilities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_facilities_updated_at ON public.facilities;
CREATE TRIGGER trigger_facilities_updated_at
    BEFORE UPDATE ON public.facilities
    FOR EACH ROW
    EXECUTE FUNCTION update_facilities_updated_at();

-- ============================================================================
-- Step 4: Enable Row Level Security (RLS)
-- ============================================================================
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow superadmins full access to facilities" ON public.facilities;
DROP POLICY IF EXISTS "Allow company users to read their facilities" ON public.facilities;
DROP POLICY IF EXISTS "Allow company admins to manage their facilities" ON public.facilities;

-- Policy: Superadmins (system admin company) can do everything
CREATE POLICY "Allow superadmins full access to facilities"
ON public.facilities
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.company_id = '00000000-0000-0000-0000-000000000001'
    )
);

-- Policy: Company users can read their own facilities
CREATE POLICY "Allow company users to read their facilities"
ON public.facilities
FOR SELECT
USING (
    company_id IN (
        SELECT company_id FROM public.users WHERE id = auth.uid()
    )
);

-- Policy: Company admins with facilities:create permission can insert
CREATE POLICY "Allow company admins to create facilities"
ON public.facilities
FOR INSERT
WITH CHECK (
    company_id IN (
        SELECT company_id FROM public.users WHERE id = auth.uid()
    )
    AND EXISTS (
        SELECT 1 FROM public.users u
        JOIN public.user_roles ur ON ur.user_id = u.id
        JOIN public.role_permissions rp ON rp.role_id = ur.role_id
        JOIN public.permissions p ON p.id = rp.permission_id
        WHERE u.id = auth.uid()
        AND p.name = 'facilities:create'
    )
);

-- Policy: Company admins with facilities:update permission can update their facilities
CREATE POLICY "Allow company admins to update facilities"
ON public.facilities
FOR UPDATE
USING (
    company_id IN (
        SELECT company_id FROM public.users WHERE id = auth.uid()
    )
    AND EXISTS (
        SELECT 1 FROM public.users u
        JOIN public.user_roles ur ON ur.user_id = u.id
        JOIN public.role_permissions rp ON rp.role_id = ur.role_id
        JOIN public.permissions p ON p.id = rp.permission_id
        WHERE u.id = auth.uid()
        AND p.name = 'facilities:update'
    )
);

-- Policy: Company admins with facilities:delete permission can delete their facilities
CREATE POLICY "Allow company admins to delete facilities"
ON public.facilities
FOR DELETE
USING (
    company_id IN (
        SELECT company_id FROM public.users WHERE id = auth.uid()
    )
    AND EXISTS (
        SELECT 1 FROM public.users u
        JOIN public.user_roles ur ON ur.user_id = u.id
        JOIN public.role_permissions rp ON rp.role_id = ur.role_id
        JOIN public.permissions p ON p.id = rp.permission_id
        WHERE u.id = auth.uid()
        AND p.name = 'facilities:delete'
    )
);

-- ============================================================================
-- Step 5: Insert facilities permissions
-- ============================================================================
INSERT INTO public.permissions (name, description)
VALUES 
    ('facilities:read', 'View facilities'),
    ('facilities:create', 'Create new facilities'),
    ('facilities:update', 'Update existing facilities'),
    ('facilities:delete', 'Delete facilities')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Step 6: Add comment to table
-- ============================================================================
COMMENT ON TABLE public.facilities IS 'Stores company facilities/locations for multi-location support';
COMMENT ON COLUMN public.facilities.company_id IS 'The company this facility belongs to';
COMMENT ON COLUMN public.facilities.name IS 'Name of the facility (unique per company)';
COMMENT ON COLUMN public.facilities.description IS 'Description of the facility';
COMMENT ON COLUMN public.facilities.is_active IS 'Whether the facility is currently active';

-- ============================================================================
-- Verification Query
-- ============================================================================
-- SELECT 
--     column_name, 
--     data_type, 
--     is_nullable,
--     column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'facilities'
-- ORDER BY ordinal_position;
