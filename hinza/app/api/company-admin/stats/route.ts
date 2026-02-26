import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface CompanyAdminStats {
  // Counts
  usersCount: number
  activeUsersCount: number
  inactiveUsersCount: number
  rolesCount: number
  productsCount: number
  rootProductsCount: number
  templatesCount: number
  complaintsCount: number
  
  // Complaints by status
  complaintsByStatus: {
    pending: number
    in_progress: number
    resolved: number
    closed: number
  }
  
  // Products by level (hierarchy depth)
  productsByLevel: Array<{
    level: number
    count: number
  }>
  
  // Users by role
  usersByRole: Array<{
    role_id: string
    role_name: string
    count: number
  }>
  
  // Complaints timeline (last 30 days)
  complaintsTimeline: Array<{
    date: string
    count: number
  }>
  
  // User registration timeline (last 30 days)
  usersTimeline: Array<{
    date: string
    count: number
  }>
  
  // Recent complaints (complaint_master_templates joined for template/type name)
  recentComplaints: Array<{
    id: string
    title: string
    status: string
    created_at: string
    template?: { name: string } | null
    complaint_master_templates?: { name: string } | null
  }>
  
  // Recent users
  recentUsers: Array<{
    id: string
    full_name: string | null
    email: string | null
    is_active: boolean
  }>
}

export async function GET(request: NextRequest) {
  // Verify user is authenticated first
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Use admin client to bypass RLS
  const adminClient = createAdminClient()
  
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('company_id')
  
  if (!companyId) {
    return NextResponse.json(
      { error: 'company_id is required' },
      { status: 400 }
    )
  }
  
  try {
    // Get users count
    const { count: usersCount } = await adminClient
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
    
    // Get active users count
    const { count: activeUsersCount } = await adminClient
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('is_active', true)
    
    // Get roles count
    const { count: rolesCount } = await adminClient
      .from('roles')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
    
    // Get products count
    const { count: productsCount } = await adminClient
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
    
    // Get root products count (level 0)
    const { count: rootProductsCount } = await adminClient
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('level', 0)
    
    // Get templates count
    const { count: templatesCount } = await adminClient
      .from('complaint_master_templates')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
    
    // Get complaints count and by status
    let complaintsCount = 0
    let complaintsByStatus = {
      pending: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    }
    let recentComplaints: CompanyAdminStats['recentComplaints'] = []
    
    try {
      const { count } = await adminClient
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
      complaintsCount = count || 0
      
      // Get complaints by status
      const { data: complaintsData } = await adminClient
        .from('complaints')
        .select('status')
        .eq('company_id', companyId)
      
      if (complaintsData) {
        complaintsData.forEach((c) => {
          const status = c.status?.toLowerCase() as keyof typeof complaintsByStatus
          if (status in complaintsByStatus) {
            complaintsByStatus[status]++
          }
        })
      }
      
      // Get recent complaints with template name (complaint type)
      const { data: recentComplaintsData } = await adminClient
        .from('complaints')
        .select('id, title, status, created_at, template:complaint_master_templates!template_id(name)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(5)

      // Normalize template: Supabase can return it as array from the relation; we need a single object
      recentComplaints = (recentComplaintsData || []).map((c) => {
        const raw = c as { id: string; title: string; status: string; created_at: string; template?: { name: string } | { name: string }[] | null }
        const templateObj = Array.isArray(raw.template) ? raw.template[0] ?? null : raw.template ?? null
        return {
          id: raw.id,
          title: raw.title,
          status: raw.status,
          created_at: raw.created_at,
          template: templateObj,
          complaint_master_templates: templateObj,
        }
      })
    } catch {
      // Table might not exist yet
    }
    
    // Get products by level
    const { data: productsData } = await adminClient
      .from('products')
      .select('level')
      .eq('company_id', companyId)
    
    const productsByLevelMap = new Map<number, number>()
    productsData?.forEach((p) => {
      const level = p.level || 0
      productsByLevelMap.set(level, (productsByLevelMap.get(level) || 0) + 1)
    })
    const productsByLevel = Array.from(productsByLevelMap.entries())
      .map(([level, count]) => ({ level, count }))
      .sort((a, b) => a.level - b.level)
    
    // Get users by role
    const { data: rolesData } = await adminClient
      .from('roles')
      .select('id, name')
      .eq('company_id', companyId)
    
    const usersByRole: CompanyAdminStats['usersByRole'] = []
    if (rolesData) {
      for (const role of rolesData) {
        const { count } = await adminClient
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('role_id', role.id)
        
        usersByRole.push({
          role_id: role.id,
          role_name: role.name,
          count: count || 0,
        })
      }
    }
    
    // Get complaints timeline (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    let complaints: Array<{ created_at: string }> = []
    try {
      const { data } = await adminClient
        .from('complaints')
        .select('created_at')
        .eq('company_id', companyId)
        .gte('created_at', thirtyDaysAgo.toISOString())
      complaints = data || []
    } catch {
      // Table might not exist
    }
    
    const complaintsTimelineMap = new Map<string, number>()
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      complaintsTimelineMap.set(dateStr, 0)
    }
    
    complaints.forEach((c) => {
      const dateStr = new Date(c.created_at).toISOString().split('T')[0]
      if (complaintsTimelineMap.has(dateStr)) {
        complaintsTimelineMap.set(
          dateStr,
          (complaintsTimelineMap.get(dateStr) || 0) + 1
        )
      }
    })
    
    const complaintsTimeline = Array.from(complaintsTimelineMap.entries()).map(
      ([date, count]) => ({ date, count })
    )
    
    // Users timeline - empty since users table doesn't have created_at
    // To enable this, add a created_at column to the users table
    const usersTimeline: Array<{ date: string; count: number }> = []
    
    // Get recent users (can't order by created_at since column doesn't exist)
    const { data: recentUsersData } = await adminClient
      .from('users')
      .select('id, full_name, email, is_active')
      .eq('company_id', companyId)
      .limit(5)
    
    const stats: CompanyAdminStats = {
      usersCount: usersCount || 0,
      activeUsersCount: activeUsersCount || 0,
      inactiveUsersCount: (usersCount || 0) - (activeUsersCount || 0),
      rolesCount: rolesCount || 0,
      productsCount: productsCount || 0,
      rootProductsCount: rootProductsCount || 0,
      templatesCount: templatesCount || 0,
      complaintsCount,
      complaintsByStatus,
      productsByLevel,
      usersByRole,
      complaintsTimeline,
      usersTimeline,
      recentComplaints,
      recentUsers: recentUsersData || [],
    }
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching company admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
