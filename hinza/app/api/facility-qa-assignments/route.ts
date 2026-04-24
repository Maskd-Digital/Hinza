import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { hasPermission, isSystemAdmin } from '@/lib/auth/permissions'

const VALID_ROLE_TYPES = ['facility_manager', 'qa_executive', 'qa_manager'] as const
type FacilityAssignmentRoleType = (typeof VALID_ROLE_TYPES)[number]

function hasQaAssignPermission(userPermissions: Parameters<typeof hasPermission>[0]): boolean {
  return (
    hasPermission(userPermissions, 'department_qa:assign') ||
    hasPermission(userPermissions, 'facility_managers:assign')
  )
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserWithRoles()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const companyId = request.nextUrl.searchParams.get('company_id')
    const roleTypeParam = request.nextUrl.searchParams.get('role_type')
    if (!companyId) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 })
    }

    if (!isSystemAdmin(user.company_id) && user.company_id !== companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!hasQaAssignPermission(user.permissions)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()
    let query = adminClient
      .from('facility_qa_assignments')
      .select('user_id, facility_id, company_id, role_type, created_at')
      .eq('company_id', companyId)

    if (roleTypeParam) {
      if (!VALID_ROLE_TYPES.includes(roleTypeParam as FacilityAssignmentRoleType)) {
        return NextResponse.json({ error: 'Invalid role_type' }, { status: 400 })
      }
      query = query.eq('role_type', roleTypeParam)
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

    if (!hasQaAssignPermission(user.permissions)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const userId = typeof body.user_id === 'string' ? body.user_id : null
    const facilityId = typeof body.facility_id === 'string' ? body.facility_id : null
    const companyId = typeof body.company_id === 'string' ? body.company_id : null
    const roleType =
      typeof body.role_type === 'string'
        ? (body.role_type as FacilityAssignmentRoleType)
        : null

    if (!userId || !facilityId || !companyId || !roleType) {
      return NextResponse.json(
        { error: 'user_id, facility_id, company_id, and role_type are required' },
        { status: 400 }
      )
    }

    if (!VALID_ROLE_TYPES.includes(roleType)) {
      return NextResponse.json({ error: 'Invalid role_type' }, { status: 400 })
    }

    if (!isSystemAdmin(user.company_id) && user.company_id !== companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    const { data: urow, error: uerr } = await adminClient
      .from('users')
      .select('id, company_id')
      .eq('id', userId)
      .single()

    if (uerr || !urow || urow.company_id !== companyId) {
      return NextResponse.json({ error: 'Invalid user for company' }, { status: 400 })
    }

    const { data: fac, error: ferr } = await adminClient
      .from('facilities')
      .select('id, company_id')
      .eq('id', facilityId)
      .single()

    if (ferr || !fac || fac.company_id !== companyId) {
      return NextResponse.json({ error: 'Invalid facility for company' }, { status: 400 })
    }

    const { data, error } = await adminClient
      .from('facility_qa_assignments')
      .insert({
        user_id: userId,
        facility_id: facilityId,
        company_id: companyId,
        role_type: roleType,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Assignment already exists' }, { status: 409 })
      }
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

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserWithRoles()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!hasQaAssignPermission(user.permissions)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = request.nextUrl.searchParams.get('user_id')
    const facilityId = request.nextUrl.searchParams.get('facility_id')
    const companyId = request.nextUrl.searchParams.get('company_id')
    const roleType = request.nextUrl.searchParams.get('role_type')

    if (!userId || !facilityId || !companyId || !roleType) {
      return NextResponse.json(
        {
          error:
            'user_id, facility_id, company_id, and role_type query params are required',
        },
        { status: 400 }
      )
    }

    if (!VALID_ROLE_TYPES.includes(roleType as FacilityAssignmentRoleType)) {
      return NextResponse.json({ error: 'Invalid role_type' }, { status: 400 })
    }

    if (!isSystemAdmin(user.company_id) && user.company_id !== companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('facility_qa_assignments')
      .delete()
      .eq('user_id', userId)
      .eq('facility_id', facilityId)
      .eq('company_id', companyId)
      .eq('role_type', roleType)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
