-- Grant departments:create to Company Admin and Superadmin roles.
-- Run after departments_and_qa_scope.sql (or standalone on an existing database).
-- Idempotent: only grants to roles that exist in public.roles.

INSERT INTO public.permissions (name, description) VALUES
('departments:create', 'Create departments for a company')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
INNER JOIN public.companies c ON c.id = r.company_id
CROSS JOIN public.permissions p
WHERE r.name ILIKE ANY (ARRAY['Company Admin', 'Superadmin'])
  AND p.name = 'departments:create'
  AND NOT EXISTS (
    SELECT 1 FROM public.role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
