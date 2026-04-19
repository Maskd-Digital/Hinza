import type { SupabaseClient } from '@supabase/supabase-js'

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
  return data.map((r) => r.department_id as string)
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
