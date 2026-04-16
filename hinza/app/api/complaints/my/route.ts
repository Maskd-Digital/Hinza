import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'

const BASE_SELECT =
  'id, status, created_at, company_id, submitted_by_id, title, description, priority, product_id, equipment_id, facility_id, products(name), facilities(name, address, city, state, country, postal_code)'

const WITH_EQUIPMENT_SELECT =
  `${BASE_SELECT}, facility_equipment(name)`

function deriveComplaintType(row: {
  equipment_id?: string | null
  product_id?: string | null
}): 'equipment' | 'product' | 'unknown' {
  if (row.equipment_id) return 'equipment'
  if (row.product_id) return 'product'
  return 'unknown'
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserWithRoles()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')

    const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : NaN
    const parsedOffset = offsetParam ? Number.parseInt(offsetParam, 10) : NaN
    const offset = Number.isFinite(parsedOffset) && parsedOffset > 0 ? parsedOffset : 0
    const limit =
      Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 50) : 50

    const adminClient = createAdminClient()

    const buildQuery = (select: string) => {
      let q = adminClient
        .from('complaints')
        .select(select)
        .eq('submitted_by_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (type === 'product') q = q.not('product_id', 'is', null)
      if (type === 'equipment') q = q.not('equipment_id', 'is', null)
      return q
    }

    let { data, error } = await buildQuery(WITH_EQUIPMENT_SELECT)

    if (error) {
      const msg = error.message || ''
      // Backward compatibility: if the relationship isn't available in PostgREST schema cache yet,
      // fall back to a safe select without equipment join.
      if (msg.includes('facility_equipment') || msg.includes('schema cache')) {
        const fallback = await buildQuery(BASE_SELECT)
        data = fallback.data
        error = fallback.error
      }
    }

    if (error) {
      if (error.code === '42P01') return NextResponse.json([])
      return NextResponse.json(
        { error: `Failed to fetch complaints: ${error.message}` },
        { status: 500 }
      )
    }

    const list = (data || []).map((row: any) => {
      const complaintType = deriveComplaintType(row)
      return {
        ...row,
        type: complaintType,
        facility_name: row.facilities?.name ?? null,
        equipment_name: row.facility_equipment?.name ?? null,
        product_name: row.products?.name ?? null,
      }
    })

    return NextResponse.json(list)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

