import type { SupabaseClient } from '@supabase/supabase-js'

export async function insertNotificationsForQaManagers(
  adminClient: SupabaseClient,
  companyId: string,
  complaintId: string,
  opts: { type: string; title: string; body: string }
): Promise<void> {
  const { data: qaManagerRoles } = await adminClient
    .from('roles')
    .select('id')
    .eq('company_id', companyId)
    .ilike('name', 'QA Manager')

  if (!qaManagerRoles?.length) return

  const roleIds = qaManagerRoles.map((r) => r.id)
  const { data: userRoleRows } = await adminClient
    .from('user_roles')
    .select('user_id')
    .in('role_id', roleIds)

  const recipientIds = [...new Set((userRoleRows || []).map((r) => r.user_id))]
  if (recipientIds.length === 0) return

  await adminClient.from('notifications').insert(
    recipientIds.map((userId) => ({
      user_id: userId,
      company_id: companyId,
      type: opts.type,
      related_entity_type: 'complaint',
      related_entity_id: complaintId,
      title: opts.title,
      body: opts.body,
    }))
  )
}

export async function insertNotificationsForFacilityManagersAtFacility(
  adminClient: SupabaseClient,
  companyId: string,
  facilityId: string,
  complaintId: string,
  title: string
): Promise<void> {
  const { data: rows } = await adminClient
    .from('facility_manager_assignments')
    .select('user_id')
    .eq('company_id', companyId)
    .eq('facility_id', facilityId)

  const recipientIds = [...new Set((rows || []).map((r) => r.user_id as string))]
  if (recipientIds.length === 0) return

  await adminClient.from('notifications').insert(
    recipientIds.map((userId) => ({
      user_id: userId,
      company_id: companyId,
      type: 'facility_equipment_complaint_created',
      related_entity_type: 'complaint',
      related_entity_id: complaintId,
      title: 'New facility equipment complaint',
      body: `"${title}" was filed for your facility.`,
    }))
  )
}
