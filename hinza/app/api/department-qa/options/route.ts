import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { isSystemAdmin } from '@/lib/auth/permissions'
import { canManageDepartmentQaAssignments } from '@/lib/auth/department-qa-assign'
import { isQAManager } from '@/lib/auth/qa-manager'
import { isOperationsManager } from '@/lib/auth/operations-manager'

interface UserOption {
  id: string
  full_name: string | null
  email: string | null
  role_type: 'executive'
}

function canReadTriageOptions(user: Parameters<typeof isQAManager>[0]): boolean {
  return (
    canManageDepartmentQaAssignments(user) ||
    isQAManager(user) ||
    isOperationsManager(user)
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

    if (!canReadTriageOptions(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    const { data: departments, error: deptError } = await adminClient
      .from('departments')
      .select('id, name, code')
      .eq('company_id', companyId)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (deptError) {
      if (deptError.code === '42P01') {
        return NextResponse.json({
          departments: [],
          managers: [],
          executives: [],
          assignments: [],
        })
      }
      return NextResponse.json({ error: deptError.message }, { status: 500 })
    }

    const { data: roles, error: rolesError } = await adminClient
      .from('roles')
      .select('id, name')
      .eq('company_id', companyId)

    if (rolesError) {
      return NextResponse.json({ error: rolesError.message }, { status: 500 })
    }

    const executiveRoleIds =
      roles?.filter((r) => r.name?.trim().toLowerCase() === 'qa executive').map((r) => r.id) ??
      []

    // Only QA Executives may be department-staffed (not QA Manager / Operations Manager).
    let executives: UserOption[] = []
    if (executiveRoleIds.length > 0) {
      const { data: userRoles } = await adminClient
        .from('user_roles')
        .select('user_id')
        .in('role_id', executiveRoleIds)

      const userIds = [...new Set((userRoles || []).map((row) => row.user_id as string))]
      if (userIds.length > 0) {
        const { data: users } = await adminClient
          .from('users')
          .select('id, full_name, email')
          .eq('company_id', companyId)
          .in('id', userIds)

        executives = (users || []).map((u) => ({
          id: u.id as string,
          full_name: u.full_name as string | null,
          email: u.email as string | null,
          role_type: 'executive' as const,
        }))
      }
    }

    const executiveIdSet = new Set(executives.map((e) => e.id))

    const { data: assignmentRows, error: asgError } = await adminClient
      .from('department_qa_assignments')
      .select('user_id, department_id, company_id, created_at')
      .eq('company_id', companyId)

    if (asgError) {
      if (asgError.code === '42P01') {
        return NextResponse.json({
          departments: departments || [],
          managers: [],
          executives,
          assignments: [],
        })
      }
      return NextResponse.json({ error: asgError.message }, { status: 500 })
    }

    const deptById = new Map((departments || []).map((d) => [d.id as string, d]))
    const execById = new Map(executives.map((e) => [e.id, e]))

    // Only return executive assignments (drop QA Manager / Ops Manager rows from API).
    const assignments = (assignmentRows || [])
      .filter((row) => executiveIdSet.has(row.user_id as string))
      .map((row) => {
        const uid = row.user_id as string
        const did = row.department_id as string
        const u = execById.get(uid)
        const dept = deptById.get(did)
        return {
          user_id: uid,
          department_id: did,
          company_id: row.company_id as string,
          created_at: row.created_at as string,
          user_name: u?.full_name || u?.email || uid,
          department_name: (dept?.name as string) || did,
          role_type: 'executive' as const,
        }
      })

    return NextResponse.json({
      departments: departments || [],
      managers: [],
      executives,
      assignments,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
