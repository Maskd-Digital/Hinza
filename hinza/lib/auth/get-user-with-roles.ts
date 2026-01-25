import { createClient } from '@/lib/supabase/server'
import { UserWithRoles, Role, Permission } from '@/types/auth'

export async function getUserWithRoles(): Promise<UserWithRoles | null> {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return null
  }

  // Get user from users table
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (error || !user) {
    return null
  }

  // Get user roles
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role_id')
    .eq('user_id', user.id)

  const roleIds = userRoles?.map((ur) => ur.role_id) || []

  let roles: Role[] = []
  let permissions: Permission[] = []

  if (roleIds.length > 0) {
    // Get role details
    const { data: rolesData } = await supabase
      .from('roles')
      .select('*')
      .in('id', roleIds)

    roles = rolesData || []

    // Get permissions for these roles
    if (roles.length > 0) {
      const { data: rolePermissions } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .in('role_id', roleIds)

      const permissionIds =
        rolePermissions?.map((rp) => rp.permission_id) || []

      if (permissionIds.length > 0) {
        const { data: permissionsData } = await supabase
          .from('permissions')
          .select('*')
          .in('id', permissionIds)

        permissions = permissionsData || []
      }
    }
  }

  return {
    ...user,
    roles,
    permissions,
  }
}
