import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { UserWithRoles, Role, Permission } from '@/types/auth'
import { headers } from 'next/headers'

export async function getUserWithRoles(): Promise<UserWithRoles | null> {
  const supabase = await createClient()
  const headersList = await headers()
  const token = headersList.get('Authorization')?.replace('Bearer ', '')
  console.log('[DEBUG] Token present in header?', !!token)

  const {
    data: { user: authUser },
  } = token
    ? await supabase.auth.getUser(token)
    : await supabase.auth.getUser()

  if (!authUser) {
    console.log('[DEBUG] No auth user found')
    return null
  }
  console.log('[DEBUG] Auth user found:', authUser.id)

  // First, try with regular client (RLS applies)
  let { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  // If not found, try with admin client (bypass RLS)
  if (error || !user) {
    console.log('[DEBUG] Regular client failed, trying admin client...')
    const adminClient = createAdminClient()

    const { data: adminUser, error: adminError } = await adminClient
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (!adminError && adminUser) {
      console.log('[DEBUG] User found via admin client')
      user = adminUser
    } else {
      // User truly doesn't exist – create a new record
      console.log('[DEBUG] User not found, creating new record...')
      
      // Optionally assign a default company
      const { data: companies } = await adminClient
        .from('companies')
        .select('id')
        .limit(1)
      const defaultCompanyId = companies?.[0]?.id || null

      const { data: newUser, error: insertError } = await adminClient
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name ?? authUser.email?.split('@')[0] ?? 'User',
          company_id: defaultCompanyId,
          is_active: true,
        })
        .select()
        .single()

      if (insertError || !newUser) {
        console.log('[DEBUG] Failed to create user record:', insertError)
        return null
      }

      console.log('[DEBUG] Created new user record:', newUser.id)
      user = newUser
    }
  } else {
    console.log('[DEBUG] Existing user found via regular client:', user.email)
  }

  // ... rest of your role/permission logic (unchanged) ...
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role_id')
    .eq('user_id', user.id)

  const roleIds = userRoles?.map((ur) => ur.role_id) || []

  let roles: Role[] = []
  let permissions: Permission[] = []

  if (roleIds.length > 0) {
    const { data: rolesData } = await supabase
      .from('roles')
      .select('*')
      .in('id', roleIds)

    roles = rolesData || []

    if (roles.length > 0) {
      const { data: rolePermissions } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .in('role_id', roleIds)

      const permissionIds = rolePermissions?.map((rp) => rp.permission_id) || []

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