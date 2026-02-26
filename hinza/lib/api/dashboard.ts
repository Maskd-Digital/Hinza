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

  // Build full 30-day timeline (every day from 30 days ago to today) with complaint counts
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const timelineMap = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    timelineMap.set(dateStr, 0)
  }
  complaints?.forEach((complaint) => {
    const complaintDate = new Date(complaint.created_at)
    const dateStr = complaintDate.toISOString().split('T')[0]
    if (timelineMap.has(dateStr)) {
      timelineMap.set(dateStr, (timelineMap.get(dateStr) ?? 0) + 1)
    }
  })
  const complaintsTimeline = Array.from(timelineMap.entries())
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
