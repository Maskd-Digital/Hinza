import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { hasPermission } from '@/lib/auth/permissions'
import { CreateProductInput } from '@/types/product'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserWithRoles()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Log evaluated permissions for debugging (permission key in DB: products:read)
    const permissionNames = (user.permissions || []).map((p) => p.name)
    console.log('[api/products] User permissions:', permissionNames)
    const canRead = hasPermission(user.permissions, 'products:read')
    if (!canRead) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id is required' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    const { data: products, error } = await adminClient
      .from('products')
      .select('*')
      .eq('company_id', companyId)
      .order('level', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch products: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(products || [])
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
    if (!hasPermission(user.permissions, 'products:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body: CreateProductInput = await request.json()

    // Build insert object - level is auto-calculated by database trigger
    const insertData: any = {
      name: body.name,
      company_id: body.company_id,
      parent_id: body.parent_id || null,
    }

    // Only include description if provided
    if (body.description !== undefined) {
      insertData.description = body.description
    }

    const adminClient = createAdminClient()
    const { data: product, error } = await adminClient
      .from('products')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: `Failed to create product: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
