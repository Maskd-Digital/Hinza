# Adding Role Column to Users Table

This script adds a `primary_role` column to the `users` table for easier role identification without requiring joins.

## Options Provided

### Option 1: Primary Role (Text Column) - **RECOMMENDED**
- Adds `primary_role` text column
- Stores the role name directly (e.g., 'Superadmin', 'Company Admin')
- Automatically populated from existing `user_roles` data
- Includes triggers to keep it in sync
- Simple to query: `SELECT * FROM users WHERE primary_role = 'Superadmin'`

### Option 2: Primary Role ID (UUID Column)
- Adds `primary_role_id` uuid column
- References `roles` table for referential integrity
- Still requires a join to get the role name
- More normalized but less convenient

### Option 3: Role Names Array (Alternative)
- Stores all role names as a text array
- Useful if you want to see all roles at once
- Commented out in the script - uncomment if needed

## Usage

1. **Run the main script** to add the column and populate it:
   ```sql
   -- Execute hinza/sql/add_role_to_users_table.sql
   ```

2. **Verify the data**:
   ```sql
   SELECT id, email, full_name, primary_role 
   FROM users 
   ORDER BY email;
   ```

3. **Query by role**:
   ```sql
   -- Find all superadmins
   SELECT * FROM users WHERE primary_role = 'Superadmin';
   
   -- Find all company admins
   SELECT * FROM users WHERE primary_role = 'Company Admin';
   ```

## Important Notes

- **Denormalization**: This adds denormalized data for convenience. The `user_roles` junction table remains the source of truth.
- **Automatic Updates**: Triggers automatically update `primary_role` when roles are added/removed via `user_roles` table.
- **Primary Role Selection**: The script selects the first role alphabetically as the primary role. You can modify the `ORDER BY` clause in the UPDATE statement to change this logic (e.g., prioritize certain roles).
- **Multiple Roles**: If a user has multiple roles, only the "primary" one is stored. To see all roles, you still need to query the `user_roles` table.

## Updating Application Code

After running this script, you can update your application code to use the `primary_role` column:

```typescript
// In your types
export interface User {
  id: string
  company_id: string
  full_name: string | null
  email: string | null
  is_active: boolean
  primary_role?: string  // Add this
}

// Quick role check without joins
const isSuperadmin = user.primary_role === 'Superadmin';
```

## Rollback

If you need to remove this column:

```sql
DROP TRIGGER IF EXISTS trigger_update_primary_role_on_insert ON public.user_roles;
DROP TRIGGER IF EXISTS trigger_update_primary_role_on_delete ON public.user_roles;
DROP FUNCTION IF EXISTS update_user_primary_role();
DROP INDEX IF EXISTS idx_users_primary_role;
ALTER TABLE public.users DROP COLUMN IF EXISTS primary_role;
```
