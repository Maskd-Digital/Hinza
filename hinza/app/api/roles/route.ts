import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { hasPermission, isSystemAdmin } from '@/lib/auth/permissions'
import { CreateRoleInput } from '@/types/role'

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
    const companyId = searchParams.get('company_id')

    // Build query - if no company_id, fetch all roles (for superadmin)
    let query = supabase
      .from('roles')
      .select('*')
      .order('name', { ascending: true })

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data: roles, error } = await query

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch roles: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(roles || [])
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getUserWithRoles()
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(sessionUser.permissions, 'roles:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body: CreateRoleInput = await request.json()

    if (!body.company_id) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 })
    }

    if (!isSystemAdmin(sessionUser.company_id) && sessionUser.company_id !== body.company_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const trimmedName = typeof body.name === 'string' ? body.name.trim() : ''

    if (!trimmedName) {
      return NextResponse.json(
        { error: 'Role name cannot be empty' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    const { data: allRoles, error: checkError } = await adminClient
      .from('roles')
      .select('id, name')
      .eq('company_id', body.company_id)

    if (checkError) {
      console.error('Error checking for existing role:', checkError)
    }

    const existingRole = allRoles?.find(
      (role) => role.name.trim().toLowerCase() === trimmedName.toLowerCase()
    )

    if (existingRole) {
      return NextResponse.json(
        { error: `A role with the name "${existingRole.name}" already exists for this company. Please choose a different name.` },
        { status: 400 }
      )
    }

    const { data: role, error: roleError } = await adminClient
      .from('roles')
      .insert({
        name: trimmedName,
        company_id: body.company_id,
      })
      .select()
      .single()

    if (roleError) {
      if (roleError.code === '23505' || roleError.message.includes('duplicate key') || roleError.message.includes('idx_roles_company_name')) {
        const { data: rolesRetry } = await adminClient
          .from('roles')
          .select('name')
          .eq('company_id', body.company_id)

        const matchingRole = rolesRetry?.find(
          (r) => r.name.trim().toLowerCase() === trimmedName.toLowerCase()
        )

        const existingName = matchingRole?.name || trimmedName
        return NextResponse.json(
          { error: `A role with the name "${existingName}" already exists for this company. Please choose a different name.` },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: `Failed to create role: ${roleError.message}` },
        { status: 500 }
      )
    }

    if (body.permission_ids && body.permission_ids.length > 0) {
      const rolePermissions = body.permission_ids.map((permissionId) => ({
        role_id: role.id,
        permission_id: permissionId,
      }))

      const { error: permError } = await adminClient.from('role_permissions').insert(rolePermissions)

      if (permError) {
        return NextResponse.json(
          { error: `Failed to assign permissions: ${permError.message}` },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(role, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
