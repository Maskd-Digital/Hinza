import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { hasPermission, isSystemAdmin } from '@/lib/auth/permissions'
import { isFacilityManager } from '@/lib/auth/facility-manager'
import { getAssignedFacilityIdsForUser } from '@/lib/api/facility-manager-scope'
import { insertNotificationsForQaManagers } from '@/lib/notify/qa-managers'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getUserWithRoles()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!hasPermission(user.permissions, 'facility_complaints:escalate')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!isFacilityManager(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()
    const { data: complaint, error: cErr } = await adminClient
      .from('complaints')
      .select(
        'id, company_id, title, equipment_id, facility_id, facility_escalated_at'
      )
      .eq('id', id)
      .single()

    if (cErr || !complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    if (!isSystemAdmin(user.company_id) && user.company_id !== complaint.company_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!complaint.equipment_id) {
      return NextResponse.json(
        { error: 'Only facility equipment complaints can be escalated from this flow' },
        { status: 400 }
      )
    }

    if (complaint.facility_escalated_at) {
      return NextResponse.json({ error: 'Already escalated' }, { status: 409 })
    }

    const fid = complaint.facility_id as string | null
    if (!fid) {
      return NextResponse.json({ error: 'Complaint has no facility' }, { status: 400 })
    }

    const assigned = await getAssignedFacilityIdsForUser(
      adminClient,
      user.id,
      user.company_id
    )
    if (!assigned.includes(fid)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date().toISOString()
    const { data: updated, error: uErr } = await adminClient
      .from('complaints')
      .update({
        facility_escalated_at: now,
        facility_escalated_by: user.id,
      })
      .eq('id', id)
      .select()
      .single()

    if (uErr) {
      return NextResponse.json({ error: uErr.message }, { status: 500 })
    }

    const complaintTitle = (complaint.title as string) || 'Complaint'
    await insertNotificationsForQaManagers(
      adminClient,
      complaint.company_id as string,
      id,
      {
        type: 'facility_complaint_escalated',
        title: 'Facility complaint escalated',
        body: `"${complaintTitle}" was escalated from Facility Manager for QA handling.`,
      }
    )

    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
