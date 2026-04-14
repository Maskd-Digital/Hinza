import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { hasPermission, isSystemAdmin } from '@/lib/auth/permissions'
import type { UpdateFacilityEquipmentInput } from '@/types/facility-equipment'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getUserWithRoles()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!hasPermission(user.permissions, 'facility_equipment:update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body: UpdateFacilityEquipmentInput = await request.json()
    const adminClient = createAdminClient()

    const { data: row, error: fetchErr } = await adminClient
      .from('facility_equipment')
      .select('id, company_id')
      .eq('id', id)
      .single()

    if (fetchErr || !row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (!isSystemAdmin(user.company_id) && user.company_id !== row.company_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const update: Record<string, unknown> = {}
    if (body.name !== undefined) update.name = body.name
    if (body.asset_tag !== undefined) update.asset_tag = body.asset_tag
    if (body.model !== undefined) update.model = body.model
    if (body.description !== undefined) update.description = body.description
    if (body.is_active !== undefined) update.is_active = body.is_active

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
    }

    const { data, error } = await adminClient
      .from('facility_equipment')
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
    const { id } = await params
    const user = await getUserWithRoles()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!hasPermission(user.permissions, 'facility_equipment:delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()
    const { data: row, error: fetchErr } = await adminClient
      .from('facility_equipment')
      .select('id, company_id')
      .eq('id', id)
      .single()

    if (fetchErr || !row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (!isSystemAdmin(user.company_id) && user.company_id !== row.company_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await adminClient.from('facility_equipment').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
