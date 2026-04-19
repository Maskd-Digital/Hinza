import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { hasPermission, isSystemAdmin } from '@/lib/auth/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUserWithRoles()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!hasPermission(user.permissions, 'departments:manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : undefined
    const code = body.code === null ? null : typeof body.code === 'string' ? body.code.trim() || null : undefined
    const sortOrder =
      typeof body.sort_order === 'number' && Number.isFinite(body.sort_order)
        ? body.sort_order
        : undefined

    const adminClient = createAdminClient()
    const { data: row, error: fErr } = await adminClient
      .from('departments')
      .select('company_id')
      .eq('id', id)
      .single()

    if (fErr || !row) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }

    if (!isSystemAdmin(user.company_id) && user.company_id !== row.company_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const update: Record<string, unknown> = {}
    if (name !== undefined) update.name = name
    if (code !== undefined) update.code = code
    if (sortOrder !== undefined) update.sort_order = sortOrder

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
    }
    update.updated_at = new Date().toISOString()

    const { data, error } = await adminClient
      .from('departments')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUserWithRoles()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!hasPermission(user.permissions, 'departments:manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const adminClient = createAdminClient()
    const { data: row, error: fErr } = await adminClient
      .from('departments')
      .select('company_id')
      .eq('id', id)
      .single()

    if (fErr || !row) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }

    if (!isSystemAdmin(user.company_id) && user.company_id !== row.company_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await adminClient.from('departments').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
