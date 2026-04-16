import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { UserWithRoles, Role, Permission } from '@/types/auth'
import { headers } from 'next/headers'

export async function getUserWithRoles(): Promise<UserWithRoles | null> {
  const supabase = await createClient()
  const headersList = await headers()
  const token = headersList.get('Authorization')?.replace('Bearer ', '')

  const {
    data: { user: authUser },
  } = token
    ? await supabase.auth.getUser(token)
    : await supabase.auth.getUser()

  if (!authUser) {
    return null
  }

  // First, try with regular client (RLS applies)
  let { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  // If not found, try with admin client (bypass RLS)
  if (error || !user) {
    const adminClient = createAdminClient()

    const { data: adminUser, error: adminError } = await adminClient
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (!adminError && adminUser) {
      user = adminUser
    } else {
      // User truly doesn't exist – create a new record
      const companyFromMetadata =
        typeof (authUser.user_metadata as any)?.company_id === 'string'
          ? ((authUser.user_metadata as any).company_id as string)
          : null

      const { data: newUser, error: insertError } = await adminClient
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name ?? authUser.email?.split('@')[0] ?? 'User',
          company_id: companyFromMetadata,
          is_active: true,
        })
        .select()
        .single()

      if (insertError || !newUser) {
        return null
      }

      user = newUser
    }
  }

  // Load roles/permissions via admin client to avoid RLS returning empty sets
  const adminClient = createAdminClient()

  const { data: userRoles } = await adminClient
    .from('user_roles')
    .select('role_id')
    .eq('user_id', user.id)

  const roleIds = userRoles?.map((ur) => ur.role_id) || []

  let roles: Role[] = []
  let permissions: Permission[] = []

  if (roleIds.length > 0) {
    const { data: rolesData } = await adminClient
      .from('roles')
      .select('*')
      .in('id', roleIds)

    roles = rolesData || []

    if (roles.length > 0) {
      const { data: rolePermissions } = await adminClient
        .from('role_permissions')
        .select('permission_id')
        .in('role_id', roleIds)

      const permissionIds = rolePermissions?.map((rp) => rp.permission_id) || []

      if (permissionIds.length > 0) {
        const { data: permissionsData } = await adminClient
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