import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCompany } from '@/lib/api/companies'
import { CreateCompanyInput } from '@/types/company'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { hasPermission } from '@/lib/auth/permissions'

export async function GET() {
  try {
    const user = await getUserWithRoles()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to read companies
    if (!hasPermission(user.permissions, 'companies:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { getCompanies } = await import('@/lib/api/companies')
    const companies = await getCompanies()

    return NextResponse.json(companies)
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

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to create companies
    if (!hasPermission(user.permissions, 'companies:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body: CreateCompanyInput = await request.json()
    const company = await createCompany(body)

    return NextResponse.json(company, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
