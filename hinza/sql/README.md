# SQL Setup Scripts for Superadmin

This directory contains SQL scripts to set up superadmin users in your Hinza application.

## Prerequisites

1. **User must exist in Supabase Auth**: Before running these scripts, ensure the user is already created in `auth.users` table (via Supabase Auth UI or API).

2. **Permissions must be seeded**: Make sure you've run the permissions INSERT statements from `DATABASE_SCHEMA_ALIGNMENT.md`.

## Quick Start

### Step 1: Get Your Auth User ID

Run this query in Supabase SQL Editor to find your user's UUID:

```sql
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
```

Copy the `id` value - you'll need it in the next step.

### Step 2: Run the Superadmin Creation Script

1. Open `create_superadmin.sql`
2. Replace the following placeholders:
   - `YOUR_AUTH_USER_ID` - The UUID from Step 1
   - `YOUR_EMAIL` - Your email address
   - `YOUR_FULL_NAME` - Your full name (e.g., "Super Admin")
3. Run the script in Supabase SQL Editor

### Step 3: Verify Setup

Run this query to verify everything is set up correctly:

```sql
SELECT 
  u.email,
  u.full_name,
  r.name AS role_name,
  COUNT(DISTINCT rp.permission_id) AS permission_count
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
WHERE u.email = 'your-email@example.com'
GROUP BY u.email, u.full_name, r.name;
```

You should see your email, role name "Superadmin", and a permission count matching the total number of permissions in your system.

## Scripts Overview

### `create_superadmin.sql`
Main script to create a superadmin user. Creates:
- A system company (if using the default approach)
- A Superadmin role with all permissions
- User record in the `users` table
- Role assignment linking user to role

### `helper_queries.sql`
Useful queries for:
- Finding auth user IDs
- Verifying superadmin setup
- Checking permissions
- Listing all users with their roles

## Two Approaches

### Approach 1: System Company (Default)
Creates a special "System" company for superadmin. This allows the superadmin to exist independently of any specific company.

**Pros:**
- Clear separation of system-level admin
- Can access all companies through permissions

**Cons:**
- Requires a special system company

### Approach 2: Company-Specific Superadmin
Creates superadmin role within a specific company. The superadmin belongs to that company but has all permissions.

**Pros:**
- Fits naturally into company structure
- No special system company needed

**Cons:**
- Superadmin is tied to one company

## Important Notes

1. **User must exist in auth.users first**: These scripts only create records in the `users` table, not in Supabase Auth. Create the user via:
   - Supabase Dashboard → Authentication → Users
   - Supabase Auth API
   - Your application's signup flow

2. **Permissions must exist**: Before creating superadmin, ensure all permissions are seeded. See `DATABASE_SCHEMA_ALIGNMENT.md` for the permissions INSERT statements.

3. **Company ID**: If using Approach 2, you need an existing company ID. You can get it with:
   ```sql
   SELECT id, name FROM companies;
   ```

4. **Role Isolation**: Since roles are company-specific in your schema, a superadmin role in one company won't automatically grant access to other companies. You'll need to implement logic in your application to check for superadmin status across companies, or create superadmin roles in all companies.

## Troubleshooting

### "User not found" error
- Ensure the user exists in `auth.users` table
- Verify the UUID matches exactly

### "Permission not found" error
- Run the permissions seed script first
- Check that permissions table has data: `SELECT COUNT(*) FROM permissions;`

### "Role already exists" warning
- This is normal if you run the script multiple times
- The `ON CONFLICT DO NOTHING` clauses prevent errors

### User can't access certain features
- Verify permissions are assigned: Use queries in `helper_queries.sql`
- Check that the role has the required permissions
- Ensure your application code checks permissions correctly
