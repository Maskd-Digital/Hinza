import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface BulkAssignRoleBody {
  company_id: string
  role_id: string
  identifiers: string[] // emails (trimmed, deduped)
}

export interface BulkAssignRoleResult {
  added: number
  skipped: number
  failed: Array< { identifier: string; reason: string }>
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: BulkAssignRoleBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { company_id, role_id, identifiers } = body
  if (!company_id || !role_id || !Array.isArray(identifiers)) {
    return NextResponse.json(
      { error: 'company_id, role_id, and identifiers (array) are required' },
      { status: 400 }
    )
  }

  const adminClient = createAdminClient()

  try {
    const role = await adminClient
      .from('roles')
      .select('id, company_id')
      .eq('id', role_id)
      .single()

    if (role.error || !role.data) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    if (role.data.company_id !== company_id) {
      return NextResponse.json(
        { error: 'Role does not belong to this company' },
        { status: 400 }
      )
    }

    const normalized = identifiers
      .map((s) => (typeof s === 'string' ? s.trim().toLowerCase() : ''))
      .filter((s) => s.length > 0)
    const uniqueEmails = [...new Set(normalized)]

    const result: BulkAssignRoleResult = {
      added: 0,
      skipped: 0,
      failed: [],
    }

    for (const email of uniqueEmails) {
      const { data: users } = await adminClient
        .from('users')
        .select('id')
        .eq('company_id', company_id)
        .ilike('email', email)
        .limit(2)

      if (!users || users.length === 0) {
        result.failed.push({
          identifier: email,
          reason: 'User not found in this company',
        })
        continue
      }

      if (users.length > 1) {
        result.failed.push({
          identifier: email,
          reason: 'Multiple users match this email',
        })
        continue
      }

      const userId = users[0].id

      const { data: existing } = await adminClient
        .from('user_roles')
        .select('user_id')
        .eq('user_id', userId)
        .eq('role_id', role_id)
        .maybeSingle()

      if (existing) {
        result.skipped += 1
        continue
      }

      const { error: insertError } = await adminClient
        .from('user_roles')
        .insert({ user_id: userId, role_id })

      if (insertError) {
        result.failed.push({
          identifier: email,
          reason: insertError.message || 'Failed to assign role',
        })
        continue
      }

      result.added += 1
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Bulk assign role error:', error)
    return NextResponse.json(
      { error: 'Failed to bulk assign role' },
      { status: 500 }
    )
  }
}
