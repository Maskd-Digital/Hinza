import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { hasPermission, isSystemAdmin } from '@/lib/auth/permissions'
import { isQAManager } from '@/lib/auth/qa-manager'
import { isQAExecutive } from '@/lib/auth/qa-executive'
import { isFacilityManager } from '@/lib/auth/facility-manager'
import { isOperationsManager } from '@/lib/auth/operations-manager'
import { isDepartmentScopedQaWorkspaceUser } from '@/lib/auth/qa-workspace-scope'
import { getAssignedFacilityIdsForUser } from '@/lib/api/facility-manager-scope'
import { userHasDepartmentAssignment } from '@/lib/api/department-scope'
import { UpdateComplaintInput } from '@/types/complaint'
import { insertNotificationsForQaManagers } from '@/lib/notify/qa-managers'

interface RouteParams {
  params: Promise<{ id: string }>
}

const COMPLAINT_DETAIL_SELECT =
  '*, products(name), facilities(address, name, city, state, country, postal_code), template:complaint_master_templates!template_id(name), facility_equipment(name, asset_tag, model), departments:departments!department_id(id, name, code)'

const COMPLAINT_DETAIL_SELECT_FALLBACK =
  '*, products(name), facilities(address, name, city, state, country, postal_code), template:complaint_master_templates!template_id(name), departments:departments!department_id(id, name, code)'

function normalizeTemplateRow(raw: Record<string, unknown>) {
  const templateObj = Array.isArray(raw.template)
    ? raw.template[0] ?? null
    : raw.template ?? null
  return { ...raw, template: templateObj, complaint_master_templates: templateObj }
}

function isPreFacilityEscalation(c: {
  equipment_id?: string | null
  facility_escalated_at?: string | null
}): boolean {
  return Boolean(c.equipment_id && !c.facility_escalated_at)
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getUserWithRoles()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    let raw: Record<string, unknown> | null = null
    let error: { code?: string; message?: string } | null = null

    const first = await adminClient
      .from('complaints')
      .select(COMPLAINT_DETAIL_SELECT)
      .eq('id', id)
      .single()

    if (first.error) {
      const msg = first.error.message || ''
      if (msg.includes('facility_equipment') || msg.includes('schema cache')) {
        const second = await adminClient
          .from('complaints')
          .select(COMPLAINT_DETAIL_SELECT_FALLBACK)
          .eq('id', id)
          .single()
        raw = second.data as Record<string, unknown> | null
        error = second.error
      } else {
        raw = first.data as Record<string, unknown> | null
        error = first.error
      }
    } else {
      raw = first.data as Record<string, unknown> | null
      error = first.error
    }

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
      }
      return NextResponse.json(
        { error: `Failed to fetch complaint: ${error.message}` },
        { status: 500 }
      )
    }

    const complaint = raw as {
      company_id: string
      equipment_id?: string | null
      facility_id?: string | null
      facility_escalated_at?: string | null
      department_id?: string | null
    }

    if (!isSystemAdmin(user.company_id) && user.company_id !== complaint.company_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (
      isPreFacilityEscalation(complaint) &&
      (isQAManager(user) || isQAExecutive(user)) &&
      !isOperationsManager(user)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (hasPermission(user.permissions, 'complaints:read') && isDepartmentScopedQaWorkspaceUser(user)) {
      const allowed = await userHasDepartmentAssignment(
        adminClient,
        user.id,
        complaint.company_id,
        complaint.department_id
      )
      if (!allowed) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    if (!hasPermission(user.permissions, 'complaints:read')) {
      if (
        !complaint.equipment_id ||
        !isFacilityManager(user) ||
        !hasPermission(user.permissions, 'facility_complaints:read')
      ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      const ids = await getAssignedFacilityIdsForUser(
        adminClient,
        user.id,
        user.company_id
      )
      const fid = complaint.facility_id
      if (!fid || !ids.includes(fid)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json(normalizeTemplateRow(raw!))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getUserWithRoles()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: UpdateComplaintInput = await request.json()
    const adminClient = createAdminClient()

    const { data: existing, error: exErr } = await adminClient
      .from('complaints')
      .select(
        'id, company_id, equipment_id, facility_id, facility_escalated_at, assigned_to_id, department_id'
      )
      .eq('id', id)
      .single()

    if (exErr || !existing) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    if (!isSystemAdmin(user.company_id) && user.company_id !== existing.company_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (
      isPreFacilityEscalation(existing as { equipment_id?: string | null; facility_escalated_at?: string | null }) &&
      (isQAManager(user) || isQAExecutive(user)) &&
      !isOperationsManager(user)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (isDepartmentScopedQaWorkspaceUser(user)) {
      const allowed = await userHasDepartmentAssignment(
        adminClient,
        user.id,
        existing.company_id as string,
        existing.department_id as string | null | undefined
      )
      if (!allowed) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const update: Record<string, unknown> = {}
    if (body.title !== undefined) update.title = body.title
    if (body.description !== undefined) update.description = body.description
    if (body.status !== undefined) update.status = body.status
    if (body.priority !== undefined) update.priority = body.priority
    if (body.assigned_to_id !== undefined) update.assigned_to_id = body.assigned_to_id
    if (body.deadline !== undefined) update.deadline = body.deadline
    if (body.submitted_for_verification_at !== undefined) {
      update.submitted_for_verification_at = body.submitted_for_verification_at
      if (body.submitted_for_verification_at) {
        update.review_status = 'pending_review'
        update.reviewed_at = null
        update.reviewed_by = null
        update.rejection_reason = null
      }
    }
    if (body.capa_document_url !== undefined) update.capa_document_url = body.capa_document_url
    if (body.sla_document_url !== undefined) update.sla_document_url = body.sla_document_url
    if (body.capa_verified_at !== undefined) update.capa_verified_at = body.capa_verified_at
    if (body.sla_verified_at !== undefined) update.sla_verified_at = body.sla_verified_at
    if (body.verified_by !== undefined) update.verified_by = body.verified_by
    if (body.review_status !== undefined) update.review_status = body.review_status
    if (body.reviewed_at !== undefined) update.reviewed_at = body.reviewed_at
    if (body.reviewed_by !== undefined) update.reviewed_by = body.reviewed_by
    if (body.rejection_reason !== undefined) update.rejection_reason = body.rejection_reason

    const fmRestricted =
      isFacilityManager(user) &&
      !hasPermission(user.permissions, 'complaints:update') &&
      hasPermission(user.permissions, 'facility_complaints:read')

    if (fmRestricted) {
      if (!existing.equipment_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      const ids = await getAssignedFacilityIdsForUser(
        adminClient,
        user.id,
        user.company_id
      )
      const fid = existing.facility_id as string | null
      if (!fid || !ids.includes(fid)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      const allowed = new Set(['title', 'description', 'priority', 'status'])
      for (const key of Object.keys(update)) {
        if (!allowed.has(key)) {
          delete update[key]
        }
      }
    } else if (isQAExecutive(user) && existing.assigned_to_id === user.id) {
      const allowed = new Set([
        'description',
        'priority',
        'status',
        'deadline',
        'submitted_for_verification_at',
        'capa_document_url',
        'sla_document_url',
        'capa_verified_at',
        'sla_verified_at',
        'verified_by',
      ])
      for (const key of Object.keys(update)) {
        if (!allowed.has(key)) {
          delete update[key]
        }
      }
    } else if (
      isQAManager(user) ||
      isOperationsManager(user) ||
      hasPermission(user.permissions, 'complaints:update')
    ) {
      // full update object as built
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await adminClient
      .from('complaints')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
      }
      return NextResponse.json(
        { error: `Failed to update complaint: ${error.message}` },
        { status: 500 }
      )
    }

    if (body.submitted_for_verification_at !== undefined && data) {
      const companyId = data.company_id as string
      const complaintTitle = (data.title as string) || 'Complaint'
      await insertNotificationsForQaManagers(adminClient, companyId, id, {
        type: 'complaint_sent_for_review',
        title: 'Complaint sent for review',
        body: `"${complaintTitle}" has been sent for your verification.`,
      }, data.department_id as string | null | undefined)
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
