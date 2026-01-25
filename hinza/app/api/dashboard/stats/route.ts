import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDashboardStats } from '@/lib/api/dashboard'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to view dashboard stats
    // For now, allow all authenticated users
    const stats = await getDashboardStats()

    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
