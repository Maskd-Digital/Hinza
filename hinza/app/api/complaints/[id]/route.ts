import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { UpdateComplaintInput } from '@/types/complaint'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    const { data: raw, error } = await adminClient
      .from('complaints')
      .select('*, products(name), facilities(address, name, city, state, country, postal_code), template:complaint_master_templates!template_id(name)')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Complaint not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: `Failed to fetch complaint: ${error.message}` },
        { status: 500 }
      )
    }

    const data = raw as Record<string, unknown>
    const templateObj = Array.isArray(data.template) ? data.template[0] ?? null : data.template ?? null
    return NextResponse.json({ ...data, template: templateObj, complaint_master_templates: templateObj })
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
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: UpdateComplaintInput = await request.json()
    const adminClient = createAdminClient()

    // Build update object (only include provided fields)
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

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const { data, error } = await adminClient
      .from('complaints')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Complaint not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: `Failed to update complaint: ${error.message}` },
        { status: 500 }
      )
    }

    if (body.submitted_for_verification_at !== undefined && data) {
      const companyId = data.company_id as string
      const complaintTitle = (data.title as string) || 'Complaint'
      const { data: qaManagerRoles } = await adminClient
        .from('roles')
        .select('id')
        .eq('company_id', companyId)
        .ilike('name', 'QA Manager')

      if (qaManagerRoles?.length) {
        const roleIds = qaManagerRoles.map((r) => r.id)
        const { data: userRoleRows } = await adminClient
          .from('user_roles')
          .select('user_id')
          .in('role_id', roleIds)

        const recipientIds = [...new Set((userRoleRows || []).map((r) => r.user_id))]
        if (recipientIds.length > 0) {
          await adminClient.from('notifications').insert(
            recipientIds.map((userId) => ({
              user_id: userId,
              company_id: companyId,
              type: 'complaint_sent_for_review',
              related_entity_type: 'complaint',
              related_entity_id: id,
              title: 'Complaint sent for review',
              body: `"${complaintTitle}" has been sent for your verification.`,
            }))
          )
        }
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
