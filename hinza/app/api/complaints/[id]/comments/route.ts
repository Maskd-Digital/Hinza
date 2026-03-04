import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteParams {
  params: Promise<{ id: string }>
}

/** GET /api/complaints/[id]/comments - List comments for complaint */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: complaintId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    const { data: complaint, error: complaintError } = await adminClient
      .from('complaints')
      .select('id, company_id')
      .eq('id', complaintId)
      .single()

    if (complaintError || !complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    const { data: userRow } = await adminClient
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!userRow || userRow.company_id !== complaint.company_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: comments, error } = await adminClient
      .from('complaint_comments')
      .select('id, complaint_id, user_id, body, created_at')
      .eq('complaint_id', complaintId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch comments: ${error.message}` },
        { status: 500 }
      )
    }

    const userIds = [...new Set((comments || []).map((c) => c.user_id).filter(Boolean) as string[])]
    let usersMap: Record<string, { full_name: string | null; email: string | null }> = {}
    if (userIds.length > 0) {
      const { data: users } = await adminClient
        .from('users')
        .select('id, full_name, email')
        .in('id', userIds)
      usersMap = (users || []).reduce(
        (acc, u) => {
          acc[u.id] = { full_name: u.full_name, email: u.email }
          return acc
        },
        {} as Record<string, { full_name: string | null; email: string | null }>
      )
    }

    const withUser = (comments || []).map((c) => ({
      ...c,
      user: c.user_id ? usersMap[c.user_id] ?? null : null,
    }))

    return NextResponse.json(withUser)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/** POST /api/complaints/[id]/comments - Create comment */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: complaintId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const commentBody = typeof body.body === 'string' ? body.body.trim() : ''

    if (!commentBody) {
      return NextResponse.json(
        { error: 'Comment body is required' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    const { data: complaint, error: complaintError } = await adminClient
      .from('complaints')
      .select('id, company_id')
      .eq('id', complaintId)
      .single()

    if (complaintError || !complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    const { data: userRow } = await adminClient
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!userRow || userRow.company_id !== complaint.company_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: comment, error } = await adminClient
      .from('complaint_comments')
      .insert({
        complaint_id: complaintId,
        user_id: user.id,
        body: commentBody,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: `Failed to create comment: ${error.message}` },
        { status: 500 }
      )
    }

    const { data: author } = await adminClient
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      ...comment,
      user: author ? { full_name: author.full_name, email: author.email } : null,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
