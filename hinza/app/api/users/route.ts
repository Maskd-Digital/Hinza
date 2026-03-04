import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  // Verify user is authenticated first
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Use admin client to bypass RLS for fetching users
  const adminClient = createAdminClient()
  
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('company_id')
  const roleId = searchParams.get('role_id')

  try {
    let query = adminClient
      .from('users')
      .select('*')

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    if (roleId) {
      const { data: userRoles } = await adminClient
        .from('user_roles')
        .select('user_id')
        .eq('role_id', roleId)
      const userIds = userRoles?.map((ur) => ur.user_id) ?? []
      if (userIds.length === 0) {
        return NextResponse.json([])
      }
      query = query.in('id', userIds)
    }

    const { data: users, error } = await query

    if (error) {
      throw error
    }
    
    // Fetch roles for each user using admin client
    const usersWithRoles = await Promise.all(
      (users || []).map(async (user) => {
        const { data: userRoles } = await adminClient
          .from('user_roles')
          .select('role_id')
          .eq('user_id', user.id)
        
        const roleIds = userRoles?.map((ur) => ur.role_id) || []
        
        let roles: Array<{ id: string; name: string }> = []
        if (roleIds.length > 0) {
          const { data: rolesData } = await adminClient
            .from('roles')
            .select('id, name')
            .in('id', roleIds)
          roles = rolesData || []
        }
        
        return {
          ...user,
          roles,
        }
      })
    )
    
    return NextResponse.json(usersWithRoles)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
