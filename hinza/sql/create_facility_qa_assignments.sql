-- Facility-level QA assignment mapping
-- Allows assigning facility-scoped users to facilities with a role type.

CREATE TABLE IF NOT EXISTS public.facility_qa_assignments (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role_type text NOT NULL CHECK (role_type IN ('facility_manager', 'qa_executive', 'qa_manager')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, facility_id, role_type)
);

CREATE INDEX IF NOT EXISTS idx_facility_qa_assignments_user
  ON public.facility_qa_assignments(user_id);

CREATE INDEX IF NOT EXISTS idx_facility_qa_assignments_facility
  ON public.facility_qa_assignments(facility_id);

CREATE INDEX IF NOT EXISTS idx_facility_qa_assignments_company
  ON public.facility_qa_assignments(company_id);
