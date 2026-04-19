import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { hasPermission, isSystemAdmin } from '@/lib/auth/permissions'
import type { UserWithRoles } from '@/types/auth'

function canReadDepartmentsList(user: UserWithRoles): boolean {
  return (
    hasPermission(user.permissions, 'departments:read') ||
    hasPermission(user.permissions, 'complaints:create') ||
    hasPermission(user.permissions, 'department_qa:assign')
  )
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserWithRoles()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const companyId = request.nextUrl.searchParams.get('company_id')
    if (!companyId) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 })
    }

    if (!isSystemAdmin(user.company_id) && user.company_id !== companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!canReadDepartmentsList(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('departments')
      .select('*')
      .eq('company_id', companyId)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

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

    if (!hasPermission(user.permissions, 'departments:manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const companyId = typeof body.company_id === 'string' ? body.company_id : null
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const code = typeof body.code === 'string' ? body.code.trim() || null : null
    const sortOrder =
      typeof body.sort_order === 'number' && Number.isFinite(body.sort_order)
        ? body.sort_order
        : 0

    if (!companyId || !name) {
      return NextResponse.json({ error: 'company_id and name are required' }, { status: 400 })
    }

    if (!isSystemAdmin(user.company_id) && user.company_id !== companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('departments')
      .insert({
        company_id: companyId,
        name,
        code,
        sort_order: sortOrder,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
