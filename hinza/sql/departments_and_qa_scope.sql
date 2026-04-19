-- ============================================================================
-- Departments, department QA assignments, complaint routing & operations notify
-- Idempotent: safe to run multiple times.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- permissions (new rows)
-- ============================================================================
INSERT INTO public.permissions (name, description) VALUES
('complaints:read_company_wide', 'View all company complaints in QA workspace (Operations Manager)')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.permissions (name, description) VALUES
('departments:read', 'View departments for a company')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.permissions (name, description) VALUES
('departments:manage', 'Create, update, and delete departments')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.permissions (name, description) VALUES
('department_qa:assign', 'Assign QA users to departments')
ON CONFLICT (name) DO NOTHING;

-- Grant new permissions to Superadmin role if present
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000002'::uuid, p.id
FROM public.permissions p
WHERE p.name IN (
  'complaints:read_company_wide',
  'departments:read',
  'departments:manage',
  'department_qa:assign'
)
AND NOT EXISTS (
  SELECT 1 FROM public.role_permissions rp
  WHERE rp.role_id = '00000000-0000-0000-0000-000000000002'::uuid
    AND rp.permission_id = p.id
);

-- ============================================================================
-- departments
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_departments_company_id ON public.departments(company_id);

-- ============================================================================
-- department_qa_assignments (QA Manager / QA Executive scoped to departments)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.department_qa_assignments (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, department_id)
);

CREATE INDEX IF NOT EXISTS idx_department_qa_assignments_user ON public.department_qa_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_department_qa_assignments_dept ON public.department_qa_assignments(department_id);
CREATE INDEX IF NOT EXISTS idx_department_qa_assignments_company ON public.department_qa_assignments(company_id);

-- ============================================================================
-- complaints: department_id, operations escalation audit
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'department_id'
    ) THEN
        ALTER TABLE public.complaints ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_complaints_department_id ON public.complaints(department_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'operations_notified_at'
    ) THEN
        ALTER TABLE public.complaints ADD COLUMN operations_notified_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'operations_notified_by'
    ) THEN
        ALTER TABLE public.complaints ADD COLUMN operations_notified_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
END $$;
