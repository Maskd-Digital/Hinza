# Database Schema Alignment

This document outlines how the codebase has been updated to match the actual database schema.

## Key Changes

### 1. User Model
**Before:**
- User had direct `role` field
- User had `facilities` array
- User had `created_at` and `updated_at`

**After (matches schema):**
- User has: `id`, `company_id`, `full_name`, `email`, `is_active`
- Roles are stored in separate `user_roles` junction table
- Roles are company-specific (stored in `roles` table with `company_id`)

### 2. Role System
The database uses a flexible role-permission system:
- `roles` table: Company-specific roles
- `permissions` table: System-wide permissions
- `role_permissions` table: Maps roles to permissions
- `user_roles` table: Maps users to roles

### 3. Company Model
**Before:**
- Company had `status` field (active/inactive)

**After (matches schema):**
- Company has: `id`, `name`, `created_at`
- No status field in the schema

## Updated Components

### Types (`types/`)
- `auth.ts`: Updated to match actual schema with `User`, `Role`, `Permission`, `UserWithRoles`
- `company.ts`: Removed `status` field
- `user.ts`: Updated to use `role_ids` array instead of single `role`

### API Functions (`lib/api/`)
- `users.ts`: 
  - Fetches users with their roles and permissions
  - Handles role assignment via `user_roles` table
  - Added `getCompanyRoles()` and `getAllPermissions()` helpers
- `companies.ts`: Removed `status` field handling

### Authentication (`lib/auth/`)
- `permissions.ts`: Updated to work with `Permission[]` array instead of role enum
- `get-user-with-roles.ts`: New utility to fetch user with roles and permissions

### Pages
- All pages updated to use `getUserWithRoles()` instead of `user_metadata.role`
- Permission checks now use `hasPermission(user.permissions, 'permission:name')`
- Company filtering based on permissions (users with `companies:read` see all, others see only their company)

### Forms
- `InviteUserForm`: Updated to use role selection (multi-select) instead of single role dropdown
- Fetches roles dynamically based on selected company

## Database Setup Required

### 1. Permissions Table
You need to seed the `permissions` table with the following permissions:

```sql
INSERT INTO permissions (name, description) VALUES
('companies:read', 'View companies'),
('companies:create', 'Create companies'),
('companies:update', 'Update companies'),
('companies:delete', 'Delete companies'),
('users:read', 'View users'),
('users:create', 'Create/invite users'),
('users:update', 'Update users'),
('users:delete', 'Delete/deactivate users'),
('complaints:read', 'View complaints'),
('complaints:create', 'Create complaints'),
('complaints:update', 'Update complaints'),
('complaints:assign', 'Assign complaints'),
('complaints:resolve', 'Resolve complaints'),
('facilities:read', 'View facilities'),
('facilities:create', 'Create facilities'),
('facilities:update', 'Update facilities'),
('facilities:delete', 'Delete facilities'),
('templates:read', 'View templates'),
('templates:create', 'Create templates'),
('templates:update', 'Update templates'),
('templates:delete', 'Delete templates'),
('reports:read', 'View reports'),
('audit:read', 'View audit logs');
```

### 2. Roles Setup
For each company, you'll need to create roles and assign permissions:

```sql
-- Example: Create a "Company Admin" role for a company
INSERT INTO roles (company_id, name) VALUES
('company-uuid', 'Company Admin');

-- Assign permissions to the role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-uuid', id FROM permissions 
WHERE name IN ('users:read', 'users:create', 'users:update', 'users:delete', ...);
```

### 3. Superadmin Setup
For superadmin functionality, you have two options:

**Option A: Create a special role with all permissions**
- Create a role (e.g., "Superadmin") that has all permissions
- Assign this role to superadmin users

**Option B: Use a special permission check**
- Add a special permission like `system:admin` that grants all access
- Check for this permission in addition to specific permissions

## Next Steps

1. **Seed Permissions**: Run the permissions INSERT statements above
2. **Create Initial Roles**: Create roles for each company with appropriate permissions
3. **Set up Superadmin**: Create superadmin role/user with all permissions
4. **Test Authentication**: Verify that users can log in and permissions are checked correctly
5. **Implement User Creation**: Complete the Supabase Admin API integration for user creation/invitation

## Important Notes

- User creation currently requires the user to already exist in `auth.users` (via Supabase Auth)
- The `users.id` field should reference `auth.users.id` (UUID)
- Role assignment happens after user creation
- All permission checks now use the database-driven permission system
- Company isolation is enforced: users without `companies:read` permission can only see their own company's data
