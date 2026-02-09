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

    const { data, error } = await adminClient
      .from('complaints')
      .select('*')
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

    return NextResponse.json(data)
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
    if (body.submitted_for_verification_at !== undefined) update.submitted_for_verification_at = body.submitted_for_verification_at
    if (body.capa_document_url !== undefined) update.capa_document_url = body.capa_document_url
    if (body.sla_document_url !== undefined) update.sla_document_url = body.sla_document_url
    if (body.capa_verified_at !== undefined) update.capa_verified_at = body.capa_verified_at
    if (body.sla_verified_at !== undefined) update.sla_verified_at = body.sla_verified_at
    if (body.verified_by !== undefined) update.verified_by = body.verified_by

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

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
