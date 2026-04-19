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
import { getAssignedDepartmentIdsForUser } from '@/lib/api/department-scope'
import { insertNotificationsForFacilityManagersAtFacility } from '@/lib/notify/qa-managers'
import { insertNotificationsForDepartmentQaManagers } from '@/lib/notify/qa-managers'

const COMPLAINT_LIST_SELECT =
  '*, products(name), facilities(address, name, city, state, country, postal_code), template:complaint_master_templates!template_id(name), departments:departments!department_id(id, name, code)'

function normalizeTemplateRow(raw: Record<string, unknown>) {
  const templateObj = Array.isArray(raw.template)
    ? raw.template[0] ?? null
    : raw.template ?? null
  return { ...raw, template: templateObj, complaint_master_templates: templateObj }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserWithRoles()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const assignedToId = searchParams.get('assigned_to_id')
    const facilityManagerScope = searchParams.get('facility_manager_scope') === '1'
    const pendingEscalationOnly = searchParams.get('pending_escalation_only') === '1'
    const qaWorkspace = searchParams.get('qa_workspace') === '1'
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')

    if (!companyId) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 })
    }

    if (!isSystemAdmin(user.company_id) && user.company_id !== companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const canReadComplaints = hasPermission(user.permissions, 'complaints:read')
    const canReadFacilityComplaints = hasPermission(
      user.permissions,
      'facility_complaints:read'
    )

    // Backward-compatible mobile behavior: authenticated end users without complaints:read
    // can still read their own submitted complaints (scoped by submitted_by_id).
    const isOwnOnly = !canReadComplaints && !facilityManagerScope

    if (facilityManagerScope) {
      if (!isFacilityManager(user) || !canReadFacilityComplaints) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
    if (!canReadComplaints && !(facilityManagerScope && canReadFacilityComplaints) && !isOwnOnly) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : NaN
    const parsedOffset = offsetParam ? Number.parseInt(offsetParam, 10) : NaN
    const offset = Number.isFinite(parsedOffset) && parsedOffset > 0 ? parsedOffset : 0
    const limit = (() => {
      if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
        // Clamp to keep this endpoint safe for mobile usage
        return Math.min(parsedLimit, isOwnOnly ? 50 : 200)
      }
      return isOwnOnly ? 50 : 200
    })()

    const adminClient = createAdminClient()
    let query = adminClient
      .from('complaints')
      .select(COMPLAINT_LIST_SELECT)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (
      qaWorkspace &&
      (isQAManager(user) || isQAExecutive(user)) &&
      !isOperationsManager(user)
    ) {
      query = query.or('equipment_id.is.null,facility_escalated_at.not.is.null')
    }

    if (qaWorkspace && isDepartmentScopedQaWorkspaceUser(user)) {
      const deptIds = await getAssignedDepartmentIdsForUser(
        adminClient,
        user.id,
        companyId
      )
      if (deptIds.length === 0) {
        return NextResponse.json([])
      }
      query = query.in('department_id', deptIds)
    }

    if (facilityManagerScope) {
      const ids = await getAssignedFacilityIdsForUser(adminClient, user.id, companyId)
      if (ids.length === 0) {
        return NextResponse.json([])
      }
      query = query.not('equipment_id', 'is', null).in('facility_id', ids)
      if (pendingEscalationOnly) {
        query = query.is('facility_escalated_at', null)
      }
    }

    if (isOwnOnly) {
      query = query.eq('submitted_by_id', user.id)
    }

    if (assignedToId) {
      query = query.eq('assigned_to_id', assignedToId)
    }

    const { data: complaints, error } = await query

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json([])
      }
      return NextResponse.json(
        { error: `Failed to fetch complaints: ${error.message}` },
        { status: 500 }
      )
    }

    const list = (complaints || []).map((row) =>
      normalizeTemplateRow(row as Record<string, unknown>)
    )
    return NextResponse.json(list)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserWithRoles()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const canCreate =
      hasPermission(user.permissions, 'complaints:create') ||
      hasPermission(user.permissions, 'facility_complaints:create')

    if (!canCreate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const companyId = typeof body.company_id === 'string' ? body.company_id : null
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const description =
      typeof body.description === 'string' ? body.description.trim() || null : null
    const facilityId = typeof body.facility_id === 'string' ? body.facility_id : null
    const equipmentId = typeof body.equipment_id === 'string' ? body.equipment_id : null
    const departmentId = typeof body.department_id === 'string' ? body.department_id : null
    const templateId =
      typeof body.template_id === 'string' && body.template_id
        ? body.template_id
        : null
    const priority =
      typeof body.priority === 'string' && body.priority ? body.priority : null
    if (!companyId || !title) {
      return NextResponse.json(
        { error: 'company_id and title are required' },
        { status: 400 }
      )
    }

    if (!isSystemAdmin(user.company_id) && user.company_id !== companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!equipmentId || !facilityId) {
      return NextResponse.json(
        { error: 'facility_id and equipment_id are required for this endpoint' },
        { status: 400 }
      )
    }

    if (!departmentId) {
      return NextResponse.json(
        { error: 'department_id is required' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    const { data: deptRow, error: deptErr } = await adminClient
      .from('departments')
      .select('id')
      .eq('id', departmentId)
      .eq('company_id', companyId)
      .maybeSingle()

    if (deptErr || !deptRow) {
      return NextResponse.json({ error: 'Invalid department for this company' }, { status: 400 })
    }

    const { data: equipment, error: eqErr } = await adminClient
      .from('facility_equipment')
      .select('id, company_id, facility_id')
      .eq('id', equipmentId)
      .single()

    if (eqErr || !equipment) {
      return NextResponse.json({ error: 'Invalid equipment' }, { status: 400 })
    }

    if (
      equipment.company_id !== companyId ||
      (equipment.facility_id as string) !== facilityId
    ) {
      return NextResponse.json(
        { error: 'Equipment does not belong to the given facility/company' },
        { status: 400 }
      )
    }

    const insertRow: Record<string, unknown> = {
      company_id: companyId,
      title,
      description,
      status: 'pending',
      priority,
      facility_id: facilityId,
      equipment_id: equipmentId,
      department_id: departmentId,
      template_id: templateId,
      submitted_by_id: user.id,
    }

    const { data: created, error: insErr } = await adminClient
      .from('complaints')
      .insert(insertRow)
      .select()
      .single()

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 })
    }

    await insertNotificationsForFacilityManagersAtFacility(
      adminClient,
      companyId,
      facilityId,
      created.id as string,
      title
    )

    await insertNotificationsForDepartmentQaManagers(
      adminClient,
      companyId,
      departmentId,
      created.id as string,
      title
    )

    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
