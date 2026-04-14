import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { hasPermission, isSystemAdmin } from '@/lib/auth/permissions'
import { isFacilityManager } from '@/lib/auth/facility-manager'
import { getAssignedFacilityIdsForUser } from '@/lib/api/facility-manager-scope'
import type { CreateFacilityEquipmentInput } from '@/types/facility-equipment'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserWithRoles()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const companyId = request.nextUrl.searchParams.get('company_id')
    const facilityId = request.nextUrl.searchParams.get('facility_id')

    if (!companyId) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 })
    }

    if (!isSystemAdmin(user.company_id) && user.company_id !== companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()
    const canCatalog = hasPermission(user.permissions, 'facility_equipment:read')
    const fmBrowse =
      isFacilityManager(user) && hasPermission(user.permissions, 'facility_complaints:read')

    if (!canCatalog && !fmBrowse) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let query = adminClient
      .from('facility_equipment')
      .select('*')
      .eq('company_id', companyId)
      .order('name', { ascending: true })

    if (facilityId) {
      query = query.eq('facility_id', facilityId)
    }

    if (fmBrowse) {
      const ids = await getAssignedFacilityIdsForUser(adminClient, user.id, companyId)
      if (ids.length === 0) return NextResponse.json([])
      query = query.in('facility_id', ids)
    }

    const { data, error } = await query

    if (error) {
      if (error.code === '42P01') return NextResponse.json([])
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserWithRoles()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!hasPermission(user.permissions, 'facility_equipment:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body: CreateFacilityEquipmentInput = await request.json()
    if (!body.company_id || !body.facility_id || !body.name?.trim()) {
      return NextResponse.json(
        { error: 'company_id, facility_id, and name are required' },
        { status: 400 }
      )
    }

    if (!isSystemAdmin(user.company_id) && user.company_id !== body.company_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    const { data: facility, error: facErr } = await adminClient
      .from('facilities')
      .select('id, company_id')
      .eq('id', body.facility_id)
      .single()

    if (facErr || !facility || facility.company_id !== body.company_id) {
      return NextResponse.json({ error: 'Invalid facility for company' }, { status: 400 })
    }

    const { data, error } = await adminClient
      .from('facility_equipment')
      .insert({
        company_id: body.company_id,
        facility_id: body.facility_id,
        name: body.name.trim(),
        asset_tag: body.asset_tag?.trim() || null,
        model: body.model?.trim() || null,
        description: body.description?.trim() || null,
        is_active: body.is_active ?? true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
