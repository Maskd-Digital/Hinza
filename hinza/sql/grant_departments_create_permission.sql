-- Grant departments:create to Company Admin and Superadmin roles.
-- Run after departments_and_qa_scope.sql (or standalone on an existing database).

INSERT INTO public.permissions (name, description) VALUES
('departments:create', 'Create departments for a company')
ON CONFLICT (name) DO NOTHING;

-- System Superadmin role (fixed UUID)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000002'::uuid, p.id
FROM public.permissions p
WHERE p.name = 'departments:create'
  AND NOT EXISTS (
    SELECT 1 FROM public.role_permissions rp
    WHERE rp.role_id = '00000000-0000-0000-0000-000000000002'::uuid
      AND rp.permission_id = p.id
  );

-- Company Admin and Superadmin roles (per company)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name ILIKE ANY (ARRAY['Company Admin', 'Superadmin'])
  AND p.name = 'departments:create'
  AND NOT EXISTS (
    SELECT 1 FROM public.role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
