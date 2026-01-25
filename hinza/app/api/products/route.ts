import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateProductInput } from '@/types/product'

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

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id is required' },
        { status: 400 }
      )
    }

    const { data: products, error } = await supabase
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
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    const { data: product, error } = await supabase
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
