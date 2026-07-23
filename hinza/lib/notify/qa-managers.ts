import type { SupabaseClient } from '@supabase/supabase-js'

/** All users with QA Manager role in the company (company-wide triage owners). */
export async function getCompanyQaManagerUserIds(
  adminClient: SupabaseClient,
  companyId: string
): Promise<string[]> {
  const { data: qaRoles } = await adminClient
    .from('roles')
    .select('id')
    .eq('company_id', companyId)
    .ilike('name', 'QA Manager')

  const qaRoleIds = (qaRoles || []).map((r) => r.id as string)
  if (qaRoleIds.length === 0) return []

  const { data: ur } = await adminClient
    .from('user_roles')
    .select('user_id')
    .in('role_id', qaRoleIds)

  const candidateIds = [...new Set((ur || []).map((r) => r.user_id as string))]
  if (candidateIds.length === 0) return []

  const { data: usersOk } = await adminClient
    .from('users')
    .select('id')
    .in('id', candidateIds)
    .eq('company_id', companyId)
    .eq('is_active', true)

  return [...new Set((usersOk || []).map((u) => u.id as string))]
}

/** Notify all company QA Managers (create, escalate, verification). */
export async function insertNotificationsForCompanyQaManagers(
  adminClient: SupabaseClient,
  companyId: string,
  complaintId: string,
  opts: { type: string; title: string; body: string }
): Promise<void> {
  const recipientIds = await getCompanyQaManagerUserIds(adminClient, companyId)
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

/**
 * @deprecated Prefer insertNotificationsForCompanyQaManagers — Managers are company-wide.
 * Kept for call-site compatibility; ignores departmentId and notifies company QA Managers.
 */
export async function insertNotificationsForDepartmentQaManagers(
  adminClient: SupabaseClient,
  companyId: string,
  _departmentId: string,
  complaintId: string,
  title: string
): Promise<void> {
  await insertNotificationsForCompanyQaManagers(adminClient, companyId, complaintId, {
    type: 'department_complaint_created',
    title: 'New complaint filed',
    body: `"${title}" was filed and is available for triage.`,
  })
}

/**
 * QA Executive sent complaint for QA Manager verification — notify company QA Managers.
 */
export async function insertNotificationsForQaManagers(
  adminClient: SupabaseClient,
  companyId: string,
  complaintId: string,
  opts: { type: string; title: string; body: string },
  _departmentId?: string | null
): Promise<void> {
  await insertNotificationsForCompanyQaManagers(adminClient, companyId, complaintId, opts)
}

export async function insertNotificationsForOperationsManagers(
  adminClient: SupabaseClient,
  companyId: string,
  complaintId: string,
  opts: { type: string; title: string; body: string }
): Promise<void> {
  const recipientIds = new Set<string>()

  const { data: opRoles } = await adminClient
    .from('roles')
    .select('id')
    .eq('company_id', companyId)
    .ilike('name', 'Operations Manager')

  for (const r of opRoles || []) {
    const { data: urOp } = await adminClient
      .from('user_roles')
      .select('user_id')
      .eq('role_id', r.id as string)
    const uids = (urOp || []).map((row) => row.user_id as string)
    if (uids.length === 0) continue
    const { data: usersOk } = await adminClient
      .from('users')
      .select('id')
      .in('id', uids)
      .eq('company_id', companyId)
    for (const u of usersOk || []) {
      recipientIds.add(u.id as string)
    }
  }

  const { data: perm } = await adminClient
    .from('permissions')
    .select('id')
    .eq('name', 'complaints:read_company_wide')
    .maybeSingle()

  if (perm?.id != null) {
    const { data: rpRows } = await adminClient
      .from('role_permissions')
      .select('role_id')
      .eq('permission_id', perm.id as number)

    const roleIds = [...new Set((rpRows || []).map((x) => x.role_id as string))]
    for (const roleId of roleIds) {
      const { data: role } = await adminClient
        .from('roles')
        .select('company_id')
        .eq('id', roleId)
        .maybeSingle()
      if (!role || (role.company_id as string) !== companyId) continue

      const { data: ur } = await adminClient
        .from('user_roles')
        .select('user_id')
        .eq('role_id', roleId)
      const uids = (ur || []).map((row) => row.user_id as string)
      if (uids.length === 0) continue
      const { data: usersOk } = await adminClient
        .from('users')
        .select('id')
        .in('id', uids)
        .eq('company_id', companyId)
      for (const u of usersOk || []) {
        recipientIds.add(u.id as string)
      }
    }
  }

  const ids = [...recipientIds]
  if (ids.length === 0) return

  await adminClient.from('notifications').insert(
    ids.map((userId) => ({
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
    .from('facility_qa_assignments')
    .select('user_id')
    .eq('company_id', companyId)
    .eq('facility_id', facilityId)
    .eq('role_type', 'facility_manager')

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
