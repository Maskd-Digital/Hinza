import type { SupabaseClient } from '@supabase/supabase-js'

export type AssignedDepartment = {
  id: string
  name: string
  code: string | null
}

export async function getAssignedDepartmentIdsForUser(
  adminClient: SupabaseClient,
  userId: string,
  companyId: string
): Promise<string[]> {
  const { data, error } = await adminClient
    .from('department_qa_assignments')
    .select('department_id')
    .eq('user_id', userId)
    .eq('company_id', companyId)

  if (error || !data?.length) return []
  return data.map((r) => r.department_id as string).filter(Boolean)
}

export async function getAssignedDepartmentsForUser(
  adminClient: SupabaseClient,
  userId: string,
  companyId: string
): Promise<AssignedDepartment[]> {
  const { data, error } = await adminClient
    .from('department_qa_assignments')
    .select('department_id, departments:departments!department_id(id, name, code)')
    .eq('user_id', userId)
    .eq('company_id', companyId)

  if (error || !data?.length) {
    // Fallback: ids only if join fails
    const ids = await getAssignedDepartmentIdsForUser(adminClient, userId, companyId)
    if (!ids.length) return []
    const { data: depts } = await adminClient
      .from('departments')
      .select('id, name, code')
      .in('id', ids)
    return (depts || []).map((d) => ({
      id: d.id as string,
      name: d.name as string,
      code: (d.code as string | null) ?? null,
    }))
  }

  const result: AssignedDepartment[] = []
  for (const row of data) {
    const dept = row.departments as
      | { id: string; name: string; code: string | null }
      | { id: string; name: string; code: string | null }[]
      | null
    const d = Array.isArray(dept) ? dept[0] : dept
    if (d?.id) {
      result.push({ id: d.id, name: d.name, code: d.code ?? null })
    } else if (row.department_id) {
      result.push({ id: row.department_id as string, name: 'Unknown', code: null })
    }
  }
  return result
}

export async function userHasDepartmentAssignment(
  adminClient: SupabaseClient,
  userId: string,
  companyId: string,
  departmentId: string | null | undefined
): Promise<boolean> {
  if (!departmentId) return false
  const ids = await getAssignedDepartmentIdsForUser(adminClient, userId, companyId)
  return ids.includes(departmentId)
}
