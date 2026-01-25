import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface DashboardStats {
  activeCompanies: number
  activeUsers: number
  totalComplaints: number
  complaintsByStatus: Record<string, number>
  complaintsTimeline: Array<{
    date: string
    count: number
  }>
}

export async function getDashboardStats(): Promise<DashboardStats> {
  // Use admin client to bypass RLS for dashboard stats (superadmin only)
  const supabase = createAdminClient()

  // Get active companies count (all companies since there's no status field)
  const { count: companiesCount, error: companiesError } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })

  if (companiesError) {
    throw new Error(`Failed to fetch companies count: ${companiesError.message}`)
  }

  // Get active users count
  const { count: usersCount, error: usersError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  if (usersError) {
    throw new Error(`Failed to fetch users count: ${usersError.message}`)
  }

  // Get complaints statistics
  const { data: complaints, error: complaintsError } = await supabase
    .from('complaints')
    .select('status, created_at')
    .order('created_at', { ascending: false })

  if (complaintsError) {
    // If complaints table doesn't exist yet, return empty stats
    return {
      activeCompanies: companiesCount || 0,
      activeUsers: usersCount || 0,
      totalComplaints: 0,
      complaintsByStatus: {},
      complaintsTimeline: [],
    }
  }

  // Calculate complaints by status
  const complaintsByStatus: Record<string, number> = {}
  complaints?.forEach((complaint) => {
    const status = complaint.status || 'Unknown'
    complaintsByStatus[status] = (complaintsByStatus[status] || 0) + 1
  })

  // Generate timeline data (last 30 days)
  const timeline: Record<string, number> = {}
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)

  complaints?.forEach((complaint) => {
    const complaintDate = new Date(complaint.created_at)
    if (complaintDate >= thirtyDaysAgo) {
      const dateKey = complaintDate.toISOString().split('T')[0] // YYYY-MM-DD
      timeline[dateKey] = (timeline[dateKey] || 0) + 1
    }
  })

  // Convert timeline to array and sort by date
  const complaintsTimeline = Object.entries(timeline)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    activeCompanies: companiesCount || 0,
    activeUsers: usersCount || 0,
    totalComplaints: complaints?.length || 0,
    complaintsByStatus,
    complaintsTimeline,
  }
}
