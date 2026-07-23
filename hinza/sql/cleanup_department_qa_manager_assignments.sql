-- Remove QA Manager and Operations Manager rows from department_qa_assignments.
-- Only QA Executives should be staffed to departments for triage.
-- Idempotent: safe to run multiple times.

DELETE FROM public.department_qa_assignments dqa
WHERE EXISTS (
  SELECT 1
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.user_id = dqa.user_id
    AND r.company_id = dqa.company_id
    AND (
      lower(trim(r.name)) = 'qa manager'
      OR lower(trim(r.name)) = 'operations manager'
    )
)
AND NOT EXISTS (
  -- Keep the row if the user is also a QA Executive (unusual dual-role case).
  SELECT 1
  FROM public.user_roles ur2
  JOIN public.roles r2 ON r2.id = ur2.role_id
  WHERE ur2.user_id = dqa.user_id
    AND r2.company_id = dqa.company_id
    AND lower(trim(r2.name)) = 'qa executive'
);

-- Verify remaining assignments are executives only (optional check):
-- SELECT dqa.*, r.name AS role_name
-- FROM department_qa_assignments dqa
-- JOIN user_roles ur ON ur.user_id = dqa.user_id
-- JOIN roles r ON r.id = ur.role_id AND r.company_id = dqa.company_id;
