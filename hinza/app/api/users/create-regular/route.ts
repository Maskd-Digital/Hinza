import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { hasPermission } from '@/lib/auth/permissions'

interface CreateRegularUserInput {
  email: string
  full_name: string
  password: string
  company_id: string
  role_id: string
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserWithRoles()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only superadmins can create users
    if (!hasPermission(user.permissions, 'users:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = await createClient()
    const adminClient = createAdminClient()
    const body: CreateRegularUserInput = await request.json()

    // Validate input
    if (!body.email || !body.full_name || !body.password || !body.company_id || !body.role_id) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Check if user with this email already exists (using admin client to bypass RLS)
    const { data: existingUser } = await adminClient
      .from('users')
      .select('id, email')
      .eq('email', body.email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists in the system' },
        { status: 400 }
      )
    }

    // Create user in Supabase Auth using Admin API
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: body.full_name,
      },
    })

    if (authError || !authUser.user) {
      return NextResponse.json(
        { error: `Failed to create user in authentication: ${authError?.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    const authUserId = authUser.user.id

    // Create user in users table (using admin client to bypass RLS)
    const { data: newUser, error: userError } = await adminClient
      .from('users')
      .insert({
        id: authUserId,
        email: body.email,
        full_name: body.full_name,
        company_id: body.company_id,
        is_active: true,
      })
      .select()
      .single()

    if (userError) {
      // If user creation fails, try to delete the auth user
      await adminClient.auth.admin.deleteUser(authUserId)
      return NextResponse.json(
        { error: `Failed to create user: ${userError.message}` },
        { status: 500 }
      )
    }

    // Verify the role exists and belongs to the company (using admin client)
    const { data: role, error: roleError } = await adminClient
      .from('roles')
      .select('id, company_id')
      .eq('id', body.role_id)
      .eq('company_id', body.company_id)
      .single()

    if (roleError || !role) {
      // Clean up: delete user from database and auth
      await adminClient.from('users').delete().eq('id', authUserId)
      await adminClient.auth.admin.deleteUser(authUserId)
      return NextResponse.json(
        { error: 'Invalid role or role does not belong to the selected company' },
        { status: 400 }
      )
    }

    // Assign role to user (using admin client to bypass RLS)
    const { error: assignError } = await adminClient
      .from('user_roles')
      .insert({
        user_id: authUserId,
        role_id: body.role_id,
      })

    if (assignError) {
      // Clean up: delete user from database and auth
      await adminClient.from('users').delete().eq('id', authUserId)
      await adminClient.auth.admin.deleteUser(authUserId)
      return NextResponse.json(
        { error: `Failed to assign role: ${assignError.message}` },
        { status: 500 }
      )
    }

    // Revalidate the users page to ensure fresh data
    revalidatePath('/users')

    return NextResponse.json(
      { message: 'User created successfully', user: newUser },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
