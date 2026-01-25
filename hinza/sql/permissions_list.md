# Permissions List

This document lists all permissions created for the Hinza Complaint Management System.

## Permission Categories

### Company Management (4 permissions)
- `companies:read` - View companies
- `companies:create` - Create new companies
- `companies:update` - Update company information
- `companies:delete` - Delete companies

### User Management (4 permissions)
- `users:read` - View users
- `users:create` - Create/invite new users
- `users:update` - Update user information and roles
- `users:delete` - Delete/deactivate users

### Complaint Management (5 permissions)
- `complaints:read` - View complaints
- `complaints:create` - Create new complaints
- `complaints:update` - Update complaint information
- `complaints:assign` - Assign complaints to users
- `complaints:resolve` - Resolve complaints

### Facility Management (4 permissions)
- `facilities:read` - View facilities
- `facilities:create` - Create new facilities
- `facilities:update` - Update facility information
- `facilities:delete` - Delete facilities

### Complaint Template Management (4 permissions)
- `templates:read` - View complaint templates
- `templates:create` - Create new complaint templates
- `templates:update` - Update complaint templates
- `templates:delete` - Delete complaint templates

### Product Management (4 permissions)
- `products:read` - View products
- `products:create` - Create new products
- `products:update` - Update product information
- `products:delete` - Delete products

### Batch Management (4 permissions)
- `batches:read` - View batches
- `batches:create` - Create new batches
- `batches:update` - Update batch information
- `batches:delete` - Delete batches

### Reports & Analytics (2 permissions)
- `reports:read` - View reports and analytics
- `reports:export` - Export reports (CSV/PDF)

### Audit & Logging (1 permission)
- `audit:read` - View audit logs

### Role Management (4 permissions)
- `roles:read` - View roles
- `roles:create` - Create new roles
- `roles:update` - Update role information and permissions
- `roles:delete` - Delete roles

### Dashboard (1 permission)
- `dashboard:view` - View dashboard

## Total: 37 Permissions

## Superadmin Role

The Superadmin role is created with **ALL** permissions listed above, giving complete system access.

## Usage

After running the seed script, you can:

1. **Assign Superadmin role to a user:**
   ```sql
   INSERT INTO public.user_roles (user_id, role_id)
   VALUES (
     'user-uuid-here',
     '00000000-0000-0000-0000-000000000002'::uuid
   );
   ```

2. **Create custom roles with specific permissions:**
   ```sql
   -- Create role
   INSERT INTO public.roles (company_id, name)
   VALUES ('company-uuid', 'QA Manager');
   
   -- Assign specific permissions
   INSERT INTO public.role_permissions (role_id, permission_id)
   SELECT 
     (SELECT id FROM roles WHERE name = 'QA Manager' AND company_id = 'company-uuid'),
     id
   FROM permissions
   WHERE name IN ('complaints:read', 'complaints:assign', 'reports:read');
   ```

3. **Check user permissions:**
   ```sql
   SELECT DISTINCT p.name
   FROM permissions p
   JOIN role_permissions rp ON p.id = rp.permission_id
   JOIN user_roles ur ON rp.role_id = ur.role_id
   WHERE ur.user_id = 'user-uuid-here';
   ```
