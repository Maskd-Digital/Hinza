import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAllPermissions } from '@/lib/api/users'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get('role_id')

    // If role_id is provided, return permissions for that role
    if (roleId) {
      const { data: rolePermissions, error } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', roleId)

      if (error) {
        return NextResponse.json(
          { error: `Failed to fetch role permissions: ${error.message}` },
          { status: 500 }
        )
      }

      const permissionIds = rolePermissions?.map((rp) => rp.permission_id) || []

      if (permissionIds.length === 0) {
        return NextResponse.json([])
      }

      const { data: permissions, error: permError } = await supabase
        .from('permissions')
        .select('*')
        .in('id', permissionIds)
        .order('name', { ascending: true })

      if (permError) {
        return NextResponse.json(
          { error: `Failed to fetch permissions: ${permError.message}` },
          { status: 500 }
        )
      }

      return NextResponse.json(permissions || [])
    }

    // Otherwise return all permissions
    const permissions = await getAllPermissions()
    return NextResponse.json(permissions)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
