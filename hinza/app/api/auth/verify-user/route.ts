import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserWithRoles()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        company_id: user.company_id,
        is_active: user.is_active,
        roles: user.roles.map((r) => ({
          id: r.id,
          name: r.name,
          company_id: r.company_id,
        })),
        permissions: user.permissions.map((p) => ({
          id: p.id,
          name: p.name,
        })),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
