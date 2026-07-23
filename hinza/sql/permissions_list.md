# Permissions List

Permissions for the Hinza Complaint Management System, aligned with **company-wide QA Manager triage**.

## Architecture (complaint workflow)

| Role | How access works |
|------|------------------|
| **QA Manager** | Company-wide triage queue (role-based). Can change department and assign executives. **Never** stored in `department_qa_assignments`. |
| **QA Executive** | Sees own assignments (`assigned_to_id`); department staffing via `department_qa_assignments` filters who can be triaged into a department. |
| **Operations Manager** | Company-wide oversight (`complaints:read_company_wide`); staffs **executives** to departments (`department_qa:assign`). **Never** stored in `department_qa_assignments`. |
| **Facility Manager** | Facility-scoped equipment complaints; escalates to QA (`facility_complaints:*`). |
| **Company Admin** | Org setup, users, roles, departments, products, facilities. |

---

## Permission Categories

### Company Management (4)
- `companies:read` - View companies
- `companies:create` - Create new companies
- `companies:update` - Update company information
- `companies:delete` - Delete companies

### User Management (4)
- `users:read` - View users
- `users:create` - Create/invite new users
- `users:update` - Update user information and roles
- `users:delete` - Delete/deactivate users

### Complaint Management (6)
- `complaints:read` - View complaints (base QA / company access)
- `complaints:create` - Create new complaints (creator picks initial `department_id`)
- `complaints:update` - Update complaint fields (status, review, docs, notify-ops, etc.)
- `complaints:assign` - Assign complaints to QA Executives (triage); often used with `complaints:update`
- `complaints:resolve` - Resolve complaints
- `complaints:read_company_wide` - Company-wide QA workspace (Operations Manager). QA Managers get company-wide visibility via **role**, not this permission.

### Department & department QA staffing (4)
- `departments:read` - View departments for a company
- `departments:create` - Create departments
- `departments:manage` - Update and delete departments
- `department_qa:assign` - Assign **QA Executives** to departments (triage assignee pool). QA Managers and Operations Managers must not be assigned to departments.

### Facility Management (4)
- `facilities:read` - View facilities
- `facilities:create` - Create new facilities
- `facilities:update` - Update facility information
- `facilities:delete` - Delete facilities

### Facility equipment & facility complaints (8)
- `facility_equipment:read` - View facility equipment registry
- `facility_equipment:create` - Create facility equipment records
- `facility_equipment:update` - Update facility equipment records
- `facility_equipment:delete` - Delete facility equipment records
- `facility_managers:assign` - Assign facility managers (and related facility QA) to facilities
- `facility_complaints:create` - Create facility equipment complaints
- `facility_complaints:read` - View facility equipment complaints for assigned facilities
- `facility_complaints:escalate` - Escalate facility equipment complaints to the QA Manager triage queue

### Complaint Template Management (4)
- `templates:read` - View complaint templates
- `templates:create` - Create new complaint templates
- `templates:update` - Update complaint templates
- `templates:delete` - Delete complaint templates

### Product Management (4)
- `products:read` - View products
- `products:create` - Create new products
- `products:update` - Update product information
- `products:delete` - Delete products

### Batch Management (4)
- `batches:read` - View batches
- `batches:create` - Create new batches
- `batches:update` - Update batch information
- `batches:delete` - Delete batches

### Reports & Analytics (2)
- `reports:read` - View reports and analytics
- `reports:export` - Export reports (CSV/PDF)

### Audit & Logging (1)
- `audit:read` - View audit logs

### Role Management (4)
- `roles:read` - View roles
- `roles:create` - Create new roles
- `roles:update` - Update role information and permissions
- `roles:delete` - Delete roles

### Dashboard (1)
- `dashboard:view` - View dashboard

## Total: 50 Permissions

---

## Recommended role permission sets

Use role **name** checks for QA Manager / QA Executive / Facility Manager / Operations Manager where the app already does; attach permissions so APIs and sidebars work.

### QA Manager (triage owner)
```
complaints:read
complaints:update
complaints:assign
complaints:resolve
departments:read
dashboard:view
```
Company-wide queue is by role (`QA Manager`), not `complaints:read_company_wide`.

### QA Executive
```
complaints:read
complaints:update
dashboard:view
```
Visibility is further limited to `assigned_to_id = self` (and department staffing for triage eligibility).

### Operations Manager
```
complaints:read
complaints:read_company_wide
complaints:update
complaints:assign
departments:read
department_qa:assign
dashboard:view
reports:read
```

### Facility Manager
```
facility_equipment:read
facility_complaints:create
facility_complaints:read
facility_complaints:escalate
facilities:read
dashboard:view
```

### Company Admin (typical)
```
users:*, roles:*, products:*, templates:*, facilities:*,
facility_equipment:*, facility_managers:assign,
departments:*, department_qa:assign,
complaints:read, complaints:create, complaints:update, complaints:assign,
facility_complaints:create, reports:read, dashboard:view
```

---

## Superadmin Role

The Superadmin role should have **ALL** 50 permissions listed above.

---

## Usage

After seeding permissions:

1. **Assign Superadmin role to a user:**
   ```sql
   INSERT INTO public.user_roles (user_id, role_id)
   VALUES (
     'user-uuid-here',
     '00000000-0000-0000-0000-000000000002'::uuid
   );
   ```

2. **Create a QA Manager role (company-wide triage):**
   ```sql
   INSERT INTO public.roles (company_id, name)
   VALUES ('company-uuid', 'QA Manager');

   INSERT INTO public.role_permissions (role_id, permission_id)
   SELECT
     (SELECT id FROM roles WHERE name = 'QA Manager' AND company_id = 'company-uuid'),
     id
   FROM permissions
   WHERE name IN (
     'complaints:read',
     'complaints:update',
     'complaints:assign',
     'complaints:resolve',
     'departments:read',
     'dashboard:view'
   );
   ```

3. **Staff QA Executives to departments** (not Managers):
   ```sql
   -- After creating QA Executive users and departments:
   INSERT INTO public.department_qa_assignments (user_id, department_id, company_id)
   VALUES ('executive-user-uuid', 'department-uuid', 'company-uuid');
   ```

4. **Check user permissions:**
   ```sql
   SELECT DISTINCT p.name
   FROM permissions p
   JOIN role_permissions rp ON p.id = rp.permission_id
   JOIN user_roles ur ON rp.role_id = ur.role_id
   WHERE ur.user_id = 'user-uuid-here';
   ```

## Related SQL

- Base seed: `seed_permissions_and_superadmin.sql`
- Department / company-wide extras: `departments_and_qa_scope.sql`
- Grants: `grant_department_permissions_company_admin.sql`, `grant_department_qa_assign_operations_manager.sql`
- Cleanup legacy manager/ops dept rows: `cleanup_department_qa_manager_assignments.sql`
