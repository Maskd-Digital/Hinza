import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { isSystemAdmin } from '@/lib/auth/permissions'
import { canManageDepartmentQaAssignments } from '@/lib/auth/department-qa-assign'

interface UserOption {
  id: string
  full_name: string | null
  email: string | null
  role_type: 'manager' | 'executive'
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

    if (!canManageDepartmentQaAssignments(user)) {
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

    const managerRoleIds =
      roles?.filter((r) => r.name?.trim().toLowerCase() === 'qa manager').map((r) => r.id) ??
      []
    const executiveRoleIds =
      roles?.filter((r) => r.name?.trim().toLowerCase() === 'qa executive').map((r) => r.id) ??
      []

    const loadUsersForRoles = async (
      roleIds: string[],
      roleType: 'manager' | 'executive'
    ): Promise<UserOption[]> => {
      if (roleIds.length === 0) return []

      const { data: userRoles } = await adminClient
        .from('user_roles')
        .select('user_id')
        .in('role_id', roleIds)

      const userIds = [...new Set((userRoles || []).map((row) => row.user_id as string))]
      if (userIds.length === 0) return []

      const { data: users } = await adminClient
        .from('users')
        .select('id, full_name, email')
        .eq('company_id', companyId)
        .in('id', userIds)

      return (users || []).map((u) => ({
        id: u.id as string,
        full_name: u.full_name as string | null,
        email: u.email as string | null,
        role_type: roleType,
      }))
    }

    const [managers, executives] = await Promise.all([
      loadUsersForRoles(managerRoleIds, 'manager'),
      loadUsersForRoles(executiveRoleIds, 'executive'),
    ])

    const { data: assignmentRows, error: asgError } = await adminClient
      .from('department_qa_assignments')
      .select('user_id, department_id, company_id, created_at')
      .eq('company_id', companyId)

    if (asgError) {
      if (asgError.code === '42P01') {
        return NextResponse.json({ departments: departments || [], managers, executives, assignments: [] })
      }
      return NextResponse.json({ error: asgError.message }, { status: 500 })
    }

    const assignmentUserIds = [
      ...new Set((assignmentRows || []).map((row) => row.user_id as string)),
    ]

    const knownUsers = new Map<string, UserOption>()
    ;[...managers, ...executives].forEach((u) => knownUsers.set(u.id, u))

    const executiveIdSet = new Set(executiveRoleIds)

    const resolveRoleType = async (userId: string): Promise<'manager' | 'executive'> => {
      const { data: userRoles } = await adminClient
        .from('user_roles')
        .select('role_id')
        .eq('user_id', userId)

      const hasExecutive = (userRoles || []).some((ur) =>
        executiveIdSet.has(ur.role_id as string)
      )
      return hasExecutive ? 'executive' : 'manager'
    }

    const missingUserIds = assignmentUserIds.filter((id) => !knownUsers.has(id))
    for (const uid of missingUserIds) {
      const { data: u } = await adminClient
        .from('users')
        .select('id, full_name, email')
        .eq('id', uid)
        .eq('company_id', companyId)
        .maybeSingle()

      if (u) {
        knownUsers.set(uid, {
          id: u.id as string,
          full_name: u.full_name as string | null,
          email: u.email as string | null,
          role_type: await resolveRoleType(uid),
        })
      }
    }

    const deptById = new Map((departments || []).map((d) => [d.id as string, d]))

    const assignments = (assignmentRows || []).map((row) => {
      const uid = row.user_id as string
      const did = row.department_id as string
      const u = knownUsers.get(uid)
      const dept = deptById.get(did)
      return {
        user_id: uid,
        department_id: did,
        company_id: row.company_id as string,
        created_at: row.created_at as string,
        user_name: u?.full_name || u?.email || uid,
        department_name: (dept?.name as string) || did,
        role_type: u?.role_type ?? 'manager',
      }
    })

    return NextResponse.json({
      departments: departments || [],
      managers,
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
