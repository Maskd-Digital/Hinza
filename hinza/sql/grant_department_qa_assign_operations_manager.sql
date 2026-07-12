-- Grant department QA assignment permissions to Operations Manager roles.
-- Run after departments_and_qa_scope.sql has been applied.

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
INNER JOIN public.companies c ON c.id = r.company_id
CROSS JOIN public.permissions p
WHERE r.name ILIKE 'Operations Manager'
  AND p.name IN ('departments:read', 'department_qa:assign')
  AND NOT EXISTS (
    SELECT 1 FROM public.role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
