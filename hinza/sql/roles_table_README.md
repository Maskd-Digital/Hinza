# Roles Table Recreation

This script recreates the roles system with proper company isolation.

## Table Structure

### `roles` Table
- `id` (UUID, Primary Key) - Auto-generated role ID
- `company_id` (UUID, Foreign Key) - Links role to a company
- `name` (TEXT) - Role name (e.g., "Company Admin", "QA Manager")

**Constraints:**
- Unique constraint on `(company_id, name)` - Prevents duplicate role names within the same company
- Foreign key to `companies` table with CASCADE delete

### `role_permissions` Table (Junction Table)
- `role_id` (UUID, Foreign Key) - References `roles.id`
- `permission_id` (INTEGER, Foreign Key) - References `permissions.id`
- Composite primary key on `(role_id, permission_id)`

**Purpose:** Links roles to permissions (many-to-many relationship)

### `user_roles` Table (Junction Table)
- `user_id` (UUID, Foreign Key) - References `users.id`
- `role_id` (UUID, Foreign Key) - References `roles.id`
- Composite primary key on `(user_id, role_id)`

**Purpose:** Links users to roles (many-to-many relationship)

## Company Isolation

The roles system ensures complete company isolation:

1. **Roles are company-specific**: Each role has a `company_id` that links it to a company
2. **No cross-company access**: Users can only be assigned roles from their own company
3. **Unique role names per company**: A company can have a role named "Admin", and another company can also have "Admin" - they are separate roles
4. **Permission isolation**: Permissions are assigned to roles, which are company-specific

## Usage Examples

### Create a Role for a Company

```sql
-- Create "QA Manager" role for Company A
INSERT INTO public.roles (company_id, name)
VALUES (
  'company-a-uuid'::uuid,
  'QA Manager'
)
RETURNING id;
```

### Assign Permissions to a Role

```sql
-- Assign specific permissions to the QA Manager role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'QA Manager' AND company_id = 'company-a-uuid'::uuid),
  id
FROM public.permissions
WHERE name IN (
  'complaints:read',
  'complaints:update',
  'complaints:assign',
  'reports:read'
);
```

### Assign Role to a User

```sql
-- Assign QA Manager role to a user
INSERT INTO public.user_roles (user_id, role_id)
VALUES (
  'user-uuid'::uuid,
  (SELECT id FROM public.roles WHERE name = 'QA Manager' AND company_id = 'company-a-uuid'::uuid)
);
```

### Query User's Roles and Permissions

```sql
-- Get all roles and permissions for a user
SELECT 
  u.email,
  r.name AS role_name,
  r.company_id,
  c.name AS company_name,
  p.name AS permission_name
FROM public.users u
JOIN public.user_roles ur ON u.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
JOIN public.companies c ON r.company_id = c.id
JOIN public.role_permissions rp ON r.id = rp.role_id
JOIN public.permissions p ON rp.permission_id = p.id
WHERE u.id = 'user-uuid'::uuid;
```

## Important Notes

1. **CASCADE Delete**: When a company is deleted, all its roles are automatically deleted (CASCADE)
2. **CASCADE Delete**: When a role is deleted, all its permission assignments and user assignments are automatically deleted
3. **Unique Constraint**: The `(company_id, name)` unique constraint ensures no duplicate role names within the same company
4. **Indexes**: Indexes are created on foreign keys for better query performance
5. **Company Isolation**: Always filter roles by `company_id` when querying to ensure proper isolation

## Security Considerations

- Always verify that a user's company matches the role's company before assignment
- Use Row Level Security (RLS) policies to enforce company isolation at the database level
- Validate company_id in application code before creating/assigning roles
