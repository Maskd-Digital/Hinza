import type { SupabaseClient } from '@supabase/supabase-js'

export async function getAssignedFacilityIdsForUser(
  adminClient: SupabaseClient,
  userId: string,
  companyId: string
): Promise<string[]> {
  const { data, error } = await adminClient
    .from('facility_qa_assignments')
    .select('facility_id')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .eq('role_type', 'facility_manager')

  if (error || !data?.length) return []
  return data.map((r) => r.facility_id as string)
}
