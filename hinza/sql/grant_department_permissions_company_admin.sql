-- Optional: attach new department permissions to existing "Company Admin" roles per company.
-- Run after departments_and_qa_scope.sql has been applied.

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name ILIKE 'Company Admin'
  AND p.name IN (
    'complaints:read_company_wide',
    'departments:read',
    'departments:manage',
    'department_qa:assign'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
