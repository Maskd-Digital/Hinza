import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CreateFacilityInput, Facility } from '@/types/facility'

// GET /api/facilities - List facilities (optionally filtered by company_id)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('company_id')

    // Use admin client to bypass RLS for superadmin access
    const adminClient = createAdminClient()
    
    let query = adminClient
      .from('facilities')
      .select('*')
      .order('name', { ascending: true })

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching facilities:', error)
      return NextResponse.json(
        { error: `Failed to fetch facilities: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Facilities GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/facilities - Create a new facility
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateFacilityInput = await request.json()

    // Validate required fields
    if (!body.name || !body.company_id) {
      return NextResponse.json(
        { error: 'Name and company_id are required' },
        { status: 400 }
      )
    }

    // Use admin client to bypass RLS
    const adminClient = createAdminClient()

    // Check if facility with same name exists in the company
    const { data: existingFacility } = await adminClient
      .from('facilities')
      .select('id')
      .eq('company_id', body.company_id)
      .eq('name', body.name)
      .single()

    if (existingFacility) {
      return NextResponse.json(
        { error: 'A facility with this name already exists in this company' },
        { status: 409 }
      )
    }

    // Create the facility
    const { data, error } = await adminClient
      .from('facilities')
      .insert({
        company_id: body.company_id,
        name: body.name,
        description: body.description || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        country: body.country || null,
        postal_code: body.postal_code || null,
        phone: body.phone || null,
        email: body.email || null,
        is_active: body.is_active ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating facility:', error)
      return NextResponse.json(
        { error: `Failed to create facility: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Facilities POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
