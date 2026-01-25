import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface UpdateRoleInput {
  name?: string
  permission_ids?: number[]
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body: UpdateRoleInput = await request.json()

    // Get the existing role to check company_id
    const { data: existingRole, error: fetchError } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    // Update role name if provided
    if (body.name !== undefined) {
      const trimmedName = body.name.trim()

      if (!trimmedName) {
        return NextResponse.json(
          { error: 'Role name cannot be empty' },
          { status: 400 }
        )
      }

      // Check if another role with the same name exists (excluding current role)
      const { data: allRoles } = await supabase
        .from('roles')
        .select('id, name')
        .eq('company_id', existingRole.company_id)

      const existingRoleWithName = allRoles?.find(
        (role) =>
          role.id !== id &&
          role.name.trim().toLowerCase() === trimmedName.toLowerCase()
      )

      if (existingRoleWithName) {
        return NextResponse.json(
          {
            error: `A role with the name "${existingRoleWithName.name}" already exists for this company. Please choose a different name.`,
          },
          { status: 400 }
        )
      }

      // Update the role name
      const { data: updatedRole, error: updateError } = await supabase
        .from('roles')
        .update({ name: trimmedName })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json(
          { error: `Failed to update role: ${updateError.message}` },
          { status: 500 }
        )
      }
    }

    // Update permissions if provided
    if (body.permission_ids !== undefined) {
      // Delete existing permissions
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', id)

      if (deleteError) {
        return NextResponse.json(
          { error: `Failed to remove existing permissions: ${deleteError.message}` },
          { status: 500 }
        )
      }

      // Insert new permissions
      if (body.permission_ids.length > 0) {
        const rolePermissions = body.permission_ids.map((permissionId) => ({
          role_id: id,
          permission_id: permissionId,
        }))

        const { error: insertError } = await supabase
          .from('role_permissions')
          .insert(rolePermissions)

        if (insertError) {
          return NextResponse.json(
            { error: `Failed to assign permissions: ${insertError.message}` },
            { status: 500 }
          )
        }
      }
    }

    // Fetch updated role
    const { data: finalRole, error: finalError } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .single()

    if (finalError) {
      return NextResponse.json(
        { error: `Failed to fetch updated role: ${finalError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(finalRole)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Delete the role (permissions will be cascade deleted)
    const { error } = await supabase.from('roles').delete().eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: `Failed to delete role: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
