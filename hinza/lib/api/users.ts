import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { User, UserWithRoles, Role, Permission } from '@/types/auth'
import {
  CreateUserInput,
  UpdateUserInput,
  InviteUserInput,
} from '@/types/user'

// Get users with their roles and permissions
export async function getUsers(companyId?: string): Promise<UserWithRoles[]> {
  // Use admin client when fetching all users (superadmin) to bypass RLS
  // Use regular client when filtering by company (company admin)
  const supabase = companyId ? await createClient() : createAdminClient()
  let query = supabase.from('users').select('*')

  if (companyId) {
    query = query.eq('company_id', companyId)
  }

  const { data: users, error } = await query

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`)
  }

  if (!users || users.length === 0) {
    return []
  }

  // Use admin client for role/permission queries to bypass RLS if needed
  const adminClient = createAdminClient()

  // Fetch roles and permissions for each user
  const usersWithRoles: UserWithRoles[] = await Promise.all(
    users.map(async (user) => {
      // Get user roles (use admin client to bypass RLS)
      const { data: userRoles } = await adminClient
        .from('user_roles')
        .select('role_id')
        .eq('user_id', user.id)

      const roleIds = userRoles?.map((ur) => ur.role_id) || []

      let roles: Role[] = []
      let permissions: Permission[] = []

      if (roleIds.length > 0) {
        // Get role details (use admin client to bypass RLS)
        const { data: rolesData } = await adminClient
          .from('roles')
          .select('*')
          .in('id', roleIds)

        roles = rolesData || []

        // Get permissions for these roles (use admin client to bypass RLS)
        if (roles.length > 0) {
          const { data: rolePermissions } = await adminClient
            .from('role_permissions')
            .select('permission_id')
            .in('role_id', roleIds)

          const permissionIds =
            rolePermissions?.map((rp) => rp.permission_id) || []

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
    })
  )

  return usersWithRoles
}

export async function getUserById(id: string): Promise<UserWithRoles | null> {
  const supabase = await createClient()
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
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

    // Get permissions
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

export async function createUser(input: CreateUserInput): Promise<User> {
  const supabase = await createClient()

  // Note: User creation in auth.users should be done via Supabase Admin API
  // This function assumes the user already exists in auth.users
  // TODO: Implement actual user creation via Supabase Auth Admin API

  const { data, error } = await supabase
    .from('users')
    .insert({
      id: input.email, // This should be the auth.users.id, not email
      email: input.email,
      full_name: input.full_name,
      company_id: input.company_id,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`)
  }

  // Assign roles if provided
  if (input.role_ids && input.role_ids.length > 0) {
    const userRoles = input.role_ids.map((roleId) => ({
      user_id: data.id,
      role_id: roleId,
    }))

    await supabase.from('user_roles').insert(userRoles)
  }

  return data
}

export async function updateUser(
  id: string,
  input: UpdateUserInput
): Promise<User> {
  const supabase = await createClient()

  // Update user basic info
  const updateData: Partial<User> = {}
  if (input.full_name !== undefined) updateData.full_name = input.full_name
  if (input.email !== undefined) updateData.email = input.email
  if (input.is_active !== undefined) updateData.is_active = input.is_active

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`)
  }

  // Update roles if provided
  if (input.role_ids !== undefined) {
    // Delete existing roles
    await supabase.from('user_roles').delete().eq('user_id', id)

    // Insert new roles
    if (input.role_ids.length > 0) {
      const userRoles = input.role_ids.map((roleId) => ({
        user_id: id,
        role_id: roleId,
      }))

      await supabase.from('user_roles').insert(userRoles)
    }
  }

  return data
}

export async function inviteUser(input: InviteUserInput): Promise<void> {
  // TODO: Implement actual invitation via Supabase Auth Admin API
  // This should:
  // 1. Create user in auth.users via Admin API
  // 2. Send invitation email
  // 3. Create user record in users table
  // 4. Assign roles

  await createUser(input)
}

export async function deactivateUser(id: string): Promise<void> {
  await updateUser(id, { is_active: false })
}

export async function activateUser(id: string): Promise<void> {
  await updateUser(id, { is_active: true })
}

// Get roles for a company
export async function getCompanyRoles(companyId: string): Promise<Role[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('company_id', companyId)

  if (error) {
    throw new Error(`Failed to fetch roles: ${error.message}`)
  }

  return data || []
}

// Get all permissions
export async function getAllPermissions(): Promise<Permission[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('permissions').select('*')

  if (error) {
    throw new Error(`Failed to fetch permissions: ${error.message}`)
  }

  return data || []
}
