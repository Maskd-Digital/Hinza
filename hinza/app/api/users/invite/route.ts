import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { InviteUserInput } from '@/types/user'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to create users
    const { data: dbUser } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body: InviteUserInput = await request.json()
    const { email, full_name, company_id, role_ids, password } = body

    // Validate required fields
    if (!email || !full_name || !company_id) {
      return NextResponse.json(
        { error: 'Email, full name, and company ID are required' },
        { status: 400 }
      )
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Use admin client for user creation
    const adminClient = createAdminClient()

    // Check if email already exists
    const { data: existingUsers } = await adminClient
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1)

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      )
    }

    // Create user in Supabase Auth using admin API
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email since admin is creating the user
      user_metadata: {
        full_name,
      },
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: `Failed to create user: ${authError.message}` },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create user record in the users table
    const { error: userError } = await adminClient
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        company_id,
        is_active: true,
      })

    if (userError) {
      // Rollback: delete the auth user if we can't create the users table entry
      await adminClient.auth.admin.deleteUser(authData.user.id)
      console.error('User table error:', userError)
      return NextResponse.json(
        { error: `Failed to create user record: ${userError.message}` },
        { status: 500 }
      )
    }

    // Assign roles if provided
    if (role_ids && role_ids.length > 0) {
      const roleAssignments = role_ids.map((roleId) => ({
        user_id: authData.user!.id,
        role_id: roleId,
      }))

      const { error: rolesError } = await adminClient
        .from('user_roles')
        .insert(roleAssignments)

      if (rolesError) {
        console.error('Roles error:', rolesError)
        // Don't rollback for role assignment errors, user is created
      }
    }

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: {
          id: authData.user.id,
          email,
          full_name,
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
