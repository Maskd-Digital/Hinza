import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { hasPermission, isSystemAdmin } from '@/lib/auth/permissions'
import { isQAManager } from '@/lib/auth/qa-manager'
import { userHasDepartmentAssignment } from '@/lib/api/department-scope'
import { insertNotificationsForOperationsManagers } from '@/lib/notify/qa-managers'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUserWithRoles()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const adminClient = createAdminClient()

    const { data: complaint, error: cErr } = await adminClient
      .from('complaints')
      .select('id, company_id, title, department_id, operations_notified_at')
      .eq('id', id)
      .single()

    if (cErr || !complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    const companyId = complaint.company_id as string

    if (!isSystemAdmin(user.company_id) && user.company_id !== companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (complaint.operations_notified_at) {
      return NextResponse.json({ error: 'Operations already notified' }, { status: 409 })
    }

    const deptId = complaint.department_id as string | null
    if (!deptId) {
      return NextResponse.json(
        { error: 'Complaint has no department; cannot escalate to Operations' },
        { status: 400 }
      )
    }

    let allowed = false
    if (hasPermission(user.permissions, 'complaints:update')) {
      allowed = true
    } else if (isQAManager(user)) {
      allowed = await userHasDepartmentAssignment(
        adminClient,
        user.id,
        companyId,
        deptId
      )
    }

    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date().toISOString()
    const { data: updated, error: uErr } = await adminClient
      .from('complaints')
      .update({
        operations_notified_at: now,
        operations_notified_by: user.id,
      })
      .eq('id', id)
      .select()
      .single()

    if (uErr) {
      return NextResponse.json({ error: uErr.message }, { status: 500 })
    }

    const complaintTitle = (complaint.title as string) || 'Complaint'
    await insertNotificationsForOperationsManagers(adminClient, companyId, id, {
      type: 'complaint_operations_notified',
      title: 'Complaint escalated to Operations',
      body: `"${complaintTitle}" was flagged for Operations awareness.`,
    })

    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
