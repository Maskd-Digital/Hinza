import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { hasPermission } from '@/lib/auth/permissions'

const SYSTEM_COMPANY_ID = '00000000-0000-0000-0000-000000000001'

interface CreateUserInput {
  email: string
  full_name: string
  company_id: string
  auth_user_id?: string
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserWithRoles()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only superadmins can create superadmin users
    if (!hasPermission(user.permissions, 'users:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = await createClient()
    const body: CreateUserInput = await request.json()

    // Validate that it's for System company
    if (body.company_id !== SYSTEM_COMPANY_ID) {
      return NextResponse.json(
        { error: 'Only System company users can be created here' },
        { status: 400 }
      )
    }

    let authUserId: string

    // If auth_user_id is provided, use it
    if (body.auth_user_id) {
      authUserId = body.auth_user_id
    } else {
      // If no auth_user_id provided, we need it
      // In production, you should use Supabase Admin API with service role key
      // to look up users by email
      return NextResponse.json(
        {
          error:
            'Auth User ID is required. Please provide the Supabase Auth user ID. You can find it in Supabase Dashboard → Authentication → Users.',
        },
        { status: 400 }
      )
    }

    // Check if user already exists in users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', authUserId)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists in the system' },
        { status: 400 }
      )
    }

    // Also check by email to prevent duplicates
    const { data: existingUserByEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', body.email)
      .single()

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: 'User with this email already exists in the system' },
        { status: 400 }
      )
    }

    // Create user in users table
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        id: authUserId,
        email: body.email,
        full_name: body.full_name,
        company_id: SYSTEM_COMPANY_ID,
        is_active: true,
      })
      .select()
      .single()

    if (userError) {
      return NextResponse.json(
        { error: `Failed to create user: ${userError.message}` },
        { status: 500 }
      )
    }

    // Find Superadmin role for System company
    const { data: superadminRole, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('company_id', SYSTEM_COMPANY_ID)
      .eq('name', 'Superadmin')
      .single()

    if (roleError || !superadminRole) {
      return NextResponse.json(
        {
          error:
            'Superadmin role not found. Please ensure the Superadmin role exists for the System company.',
        },
        { status: 500 }
      )
    }

    // Assign Superadmin role to user
    const { error: assignError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authUserId,
        role_id: superadminRole.id,
      })

    if (assignError) {
      return NextResponse.json(
        { error: `Failed to assign role: ${assignError.message}` },
        { status: 500 }
      )
    }

    // Revalidate the users page to ensure fresh data
    revalidatePath('/users')

    return NextResponse.json(
      { message: 'Superadmin user created successfully', user: newUser },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
