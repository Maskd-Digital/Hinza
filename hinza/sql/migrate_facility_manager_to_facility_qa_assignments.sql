-- Consolidate facility_manager_assignments into facility_qa_assignments with role_type
-- Run after create_facility_qa_assignments.sql

ALTER TABLE public.facility_qa_assignments
  ADD COLUMN IF NOT EXISTS role_type text;

UPDATE public.facility_qa_assignments
SET role_type = 'qa_executive'
WHERE role_type IS NULL;

ALTER TABLE public.facility_qa_assignments
  DROP CONSTRAINT IF EXISTS facility_qa_assignments_pkey;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'facility_qa_assignments_role_type_check'
  ) THEN
    ALTER TABLE public.facility_qa_assignments
      ADD CONSTRAINT facility_qa_assignments_role_type_check
      CHECK (role_type IN ('facility_manager', 'qa_executive', 'qa_manager'));
  END IF;
END$$;

ALTER TABLE public.facility_qa_assignments
  ALTER COLUMN role_type SET NOT NULL;

ALTER TABLE public.facility_qa_assignments
  ADD PRIMARY KEY (user_id, facility_id, role_type);

INSERT INTO public.facility_qa_assignments (user_id, facility_id, company_id, role_type)
SELECT fma.user_id, fma.facility_id, fma.company_id, 'facility_manager'
FROM public.facility_manager_assignments fma
ON CONFLICT (user_id, facility_id, role_type) DO NOTHING;

DROP TABLE IF EXISTS public.facility_manager_assignments;
