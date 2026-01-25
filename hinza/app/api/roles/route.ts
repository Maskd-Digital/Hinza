import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateRoleInput = await request.json()
    const trimmedName = body.name.trim()

    if (!trimmedName) {
      return NextResponse.json(
        { error: 'Role name cannot be empty' },
        { status: 400 }
      )
    }

    // Check if a role with the same name (case-insensitive) already exists for this company
    // Fetch all roles for the company and do case-insensitive comparison
    const { data: allRoles, error: checkError } = await supabase
      .from('roles')
      .select('id, name')
      .eq('company_id', body.company_id)

    if (checkError) {
      // If there's an error checking, log it but continue (database constraint will catch it)
      console.error('Error checking for existing role:', checkError)
    }

    // Do case-insensitive comparison
    const existingRole = allRoles?.find(
      (role) => role.name.trim().toLowerCase() === trimmedName.toLowerCase()
    )

    if (existingRole) {
      return NextResponse.json(
        { error: `A role with the name "${existingRole.name}" already exists for this company. Please choose a different name.` },
        { status: 400 }
      )
    }

    // Create role
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .insert({
        name: trimmedName,
        company_id: body.company_id,
      })
      .select()
      .single()

    if (roleError) {
      // Check if it's a duplicate key error (PostgreSQL error code 23505)
      if (roleError.code === '23505' || roleError.message.includes('duplicate key') || roleError.message.includes('idx_roles_company_name')) {
        // If we hit the constraint, fetch all roles and find the matching one (case-insensitive)
        const { data: allRoles } = await supabase
          .from('roles')
          .select('name')
          .eq('company_id', body.company_id)

        const matchingRole = allRoles?.find(
          (role) => role.name.trim().toLowerCase() === trimmedName.toLowerCase()
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

    // Assign permissions
    if (body.permission_ids && body.permission_ids.length > 0) {
      const rolePermissions = body.permission_ids.map((permissionId) => ({
        role_id: role.id,
        permission_id: permissionId,
      }))

      const { error: permError } = await supabase
        .from('role_permissions')
        .insert(rolePermissions)

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
