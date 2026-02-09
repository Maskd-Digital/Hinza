import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const assignedToId = searchParams.get('assigned_to_id')

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id is required' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    let query = adminClient
      .from('complaints')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(200)

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

    return NextResponse.json(complaints || [])
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
