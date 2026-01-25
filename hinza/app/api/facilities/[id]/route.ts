import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { UpdateFacilityInput } from '@/types/facility'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/facilities/[id] - Get a single facility
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
      .from('facilities')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Facility not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: `Failed to fetch facility: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Facility GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/facilities/[id] - Update a facility
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

    const body: UpdateFacilityInput = await request.json()
    const adminClient = createAdminClient()

    // If updating name, check for duplicates
    if (body.name) {
      const { data: facility } = await adminClient
        .from('facilities')
        .select('company_id')
        .eq('id', id)
        .single()

      if (facility) {
        const { data: existingFacility } = await adminClient
          .from('facilities')
          .select('id')
          .eq('company_id', facility.company_id)
          .eq('name', body.name)
          .neq('id', id)
          .single()

        if (existingFacility) {
          return NextResponse.json(
            { error: 'A facility with this name already exists in this company' },
            { status: 409 }
          )
        }
      }
    }

    const { data, error } = await adminClient
      .from('facilities')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Facility not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: `Failed to update facility: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Facility PATCH error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/facilities/[id] - Delete a facility
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { error } = await adminClient
      .from('facilities')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: `Failed to delete facility: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Facility deleted successfully' })
  } catch (error) {
    console.error('Facility DELETE error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
