import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { hasPermission, isSystemAdmin } from '@/lib/auth/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  
  // Verify user is authenticated first
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Use admin client to bypass RLS
  const adminClient = createAdminClient()
  
  try {
    const { data: user, error } = await adminClient
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      throw error
    }
    
    // Fetch user roles
    const { data: userRoles } = await adminClient
      .from('user_roles')
      .select('role_id')
      .eq('user_id', id)
    
    const roleIds = userRoles?.map((ur) => ur.role_id) || []
    
    let roles: Array<{ id: string; name: string }> = []
    if (roleIds.length > 0) {
      const { data: rolesData } = await adminClient
        .from('roles')
        .select('id, name')
        .in('id', roleIds)
      roles = rolesData || []
    }
    
    return NextResponse.json({ ...user, roles })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  
  const sessionUser = await getUserWithRoles()
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!hasPermission(sessionUser.permissions, 'users:update')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // Use admin client to bypass RLS
  const adminClient = createAdminClient()
  
  try {
    const body = await request.json()
    const { full_name, email, is_active, role_ids } = body

    const { data: targetUser, error: targetUserError } = await adminClient
      .from('users')
      .select('id, company_id')
      .eq('id', id)
      .single()

    if (targetUserError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!isSystemAdmin(sessionUser.company_id) && sessionUser.company_id !== targetUser.company_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Update user data
    const updateData: Record<string, unknown> = {}
    if (full_name !== undefined) updateData.full_name = full_name
    if (email !== undefined) updateData.email = email
    if (is_active !== undefined) updateData.is_active = is_active
    
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await adminClient
        .from('users')
        .update(updateData)
        .eq('id', id)
      
      if (updateError) {
        throw updateError
      }
    }
    
    // Update roles if provided
    if (role_ids !== undefined) {
      if (id === sessionUser.id) {
        return NextResponse.json(
          { error: 'You cannot update your own roles' },
          { status: 400 }
        )
      }

      // Remove existing roles
      await adminClient.from('user_roles').delete().eq('user_id', id)
      
      // Add new roles
      if (role_ids.length > 0) {
        const roleAssignments = role_ids.map((roleId: string) => ({
          user_id: id,
          role_id: roleId,
        }))
        
        const { error: rolesError } = await adminClient
          .from('user_roles')
          .insert(roleAssignments)
        
        if (rolesError) {
          throw rolesError
        }
      }
    }
    
    // Fetch updated user
    const { data: user } = await adminClient
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  
  const user = await getUserWithRoles()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!hasPermission(user.permissions, 'users:delete')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // Use admin client to bypass RLS
  const adminClient = createAdminClient()
  
  try {
    const { data: targetUser, error: targetUserError } = await adminClient
      .from('users')
      .select('id, company_id')
      .eq('id', id)
      .single()

    if (targetUserError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!isSystemAdmin(user.company_id) && user.company_id !== targetUser.company_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (user.id === id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    // Remove user roles first
    await adminClient.from('user_roles').delete().eq('user_id', id)
    
    // Deactivate user (soft delete)
    const { error } = await adminClient
      .from('users')
      .update({ is_active: false })
      .eq('id', id)
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
