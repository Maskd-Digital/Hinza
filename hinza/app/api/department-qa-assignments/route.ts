import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { hasPermission, isSystemAdmin } from '@/lib/auth/permissions'

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

    if (!hasPermission(user.permissions, 'department_qa:assign')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('department_qa_assignments')
      .select('user_id, department_id, company_id, created_at')
      .eq('company_id', companyId)

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

    if (!hasPermission(user.permissions, 'department_qa:assign')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const userId = typeof body.user_id === 'string' ? body.user_id : null
    const departmentId = typeof body.department_id === 'string' ? body.department_id : null
    const companyId = typeof body.company_id === 'string' ? body.company_id : null

    if (!userId || !departmentId || !companyId) {
      return NextResponse.json(
        { error: 'user_id, department_id, and company_id are required' },
        { status: 400 }
      )
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

    const { data: dept, error: derr } = await adminClient
      .from('departments')
      .select('id, company_id')
      .eq('id', departmentId)
      .single()

    if (derr || !dept || dept.company_id !== companyId) {
      return NextResponse.json({ error: 'Invalid department for company' }, { status: 400 })
    }

    const { data, error } = await adminClient
      .from('department_qa_assignments')
      .insert({ user_id: userId, department_id: departmentId, company_id: companyId })
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

    if (!hasPermission(user.permissions, 'department_qa:assign')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = request.nextUrl.searchParams.get('user_id')
    const departmentId = request.nextUrl.searchParams.get('department_id')
    const companyId = request.nextUrl.searchParams.get('company_id')

    if (!userId || !departmentId || !companyId) {
      return NextResponse.json(
        { error: 'user_id, department_id, and company_id query params are required' },
        { status: 400 }
      )
    }

    if (!isSystemAdmin(user.company_id) && user.company_id !== companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('department_qa_assignments')
      .delete()
      .eq('user_id', userId)
      .eq('department_id', departmentId)
      .eq('company_id', companyId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
