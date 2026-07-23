import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { isSystemAdmin } from '@/lib/auth/permissions'
import { canManageDepartmentQaAssignments } from '@/lib/auth/department-qa-assign'
import { isQAManager } from '@/lib/auth/qa-manager'
import { isQAExecutive } from '@/lib/auth/qa-executive'
import { isOperationsManager } from '@/lib/auth/operations-manager'
import { getAssignedDepartmentsForUser } from '@/lib/api/department-scope'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserWithRoles()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const companyId = request.nextUrl.searchParams.get('company_id')
    const mine = request.nextUrl.searchParams.get('mine') === '1'
    if (!companyId) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 })
    }

    if (!isSystemAdmin(user.company_id) && user.company_id !== companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // Executives can read their own assigned departments (mine=1).
    // Managers/Ops list all assignments for triage assignee filtering.
    if (mine) {
      const canReadOwn =
        isQAManager(user) ||
        isQAExecutive(user) ||
        isOperationsManager(user) ||
        canManageDepartmentQaAssignments(user)
      if (!canReadOwn) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      const departments = await getAssignedDepartmentsForUser(
        adminClient,
        user.id,
        companyId
      )
      return NextResponse.json({ departments })
    }

    if (
      !canManageDepartmentQaAssignments(user) &&
      !isQAManager(user) &&
      !isOperationsManager(user)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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

    if (!canManageDepartmentQaAssignments(user)) {
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

    // Only QA Executives may be assigned to departments (not QA Manager / Operations Manager).
    const { data: roles } = await adminClient
      .from('roles')
      .select('id, name')
      .eq('company_id', companyId)

    const executiveRoleIds =
      roles
        ?.filter((r) => r.name?.trim().toLowerCase() === 'qa executive')
        .map((r) => r.id as string) ?? []

    const blockedRoleIds =
      roles
        ?.filter((r) => {
          const n = r.name?.trim().toLowerCase() ?? ''
          return n === 'qa manager' || n === 'operations manager'
        })
        .map((r) => r.id as string) ?? []

    if (blockedRoleIds.length > 0) {
      const { data: blocked } = await adminClient
        .from('user_roles')
        .select('role_id')
        .eq('user_id', userId)
        .in('role_id', blockedRoleIds)
        .limit(1)
      if (blocked && blocked.length > 0) {
        return NextResponse.json(
          {
            error:
              'QA Managers and Operations Managers cannot be assigned to departments. Assign QA Executives only.',
          },
          { status: 400 }
        )
      }
    }

    if (executiveRoleIds.length === 0) {
      return NextResponse.json(
        { error: 'Assignee must be a QA Executive' },
        { status: 400 }
      )
    }

    const { data: execUr } = await adminClient
      .from('user_roles')
      .select('user_id')
      .eq('user_id', userId)
      .in('role_id', executiveRoleIds)
      .maybeSingle()

    if (!execUr) {
      return NextResponse.json(
        { error: 'Assignee must be a QA Executive' },
        { status: 400 }
      )
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

    if (!canManageDepartmentQaAssignments(user)) {
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
