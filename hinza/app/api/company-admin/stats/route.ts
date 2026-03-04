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

  // Complaint metrics for management
  complaintMetrics: {
    openBacklog: number
    overdue: number
    resolvedLast30Days: number
    avgResolutionDays: number | null
  }
  complaintsByPriority: Array<{ priority: string; count: number }>
  complaintsByTemplate: Array<{ template_id: string | null; template_name: string; count: number }>
  complaintsByProduct: Array<{ product_id: string | null; product_name: string; count: number }>
  complaintsByFacility: Array<{ facility_id: string | null; facility_name: string; count: number }>
  complaintsAging: Array<{ bucket: string; label: string; count: number }>
  resolutionTimeBuckets: Array<{ bucket: string; label: string; count: number }>
  complaintsTimelineResolved: Array<{ date: string; count: number }>
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

    // Extended complaint metrics (management analytics)
    let complaintMetrics = {
      openBacklog: 0,
      overdue: 0,
      resolvedLast30Days: 0,
      avgResolutionDays: null as number | null,
    }
    let complaintsByPriority: CompanyAdminStats['complaintsByPriority'] = []
    let complaintsByTemplate: CompanyAdminStats['complaintsByTemplate'] = []
    let complaintsByProduct: CompanyAdminStats['complaintsByProduct'] = []
    let complaintsByFacility: CompanyAdminStats['complaintsByFacility'] = []
    let complaintsAging: CompanyAdminStats['complaintsAging'] = []
    let resolutionTimeBuckets: CompanyAdminStats['resolutionTimeBuckets'] = []
    let complaintsTimelineResolved: CompanyAdminStats['complaintsTimelineResolved'] = []

    try {
      type ComplaintRow = {
        status: string
        priority: string | null
        created_at: string
        updated_at: string | null
        deadline: string | null
        facility_id: string | null
        product_id: string | null
        template_id: string | null
      }
      const { data: allComplaints } = await adminClient
        .from('complaints')
        .select('status, priority, created_at, updated_at, deadline, facility_id, product_id, template_id')
        .eq('company_id', companyId)

      const complaintRows = (allComplaints || []) as ComplaintRow[]

      const openStatuses = ['pending', 'in_progress']
      complaintMetrics.openBacklog = complaintRows.filter((c) =>
        openStatuses.includes((c.status || '').toLowerCase())
      ).length

      const now = new Date().toISOString()
      complaintMetrics.overdue = complaintRows.filter((c) => {
        const status = (c.status || '').toLowerCase()
        if (['resolved', 'closed'].includes(status)) return false
        if (!c.deadline) return false
        return c.deadline < now
      }).length

      const resolvedClosed = complaintRows.filter((c) =>
        ['resolved', 'closed'].includes((c.status || '').toLowerCase())
      )
      complaintMetrics.resolvedLast30Days = resolvedClosed.filter((c) => {
        const updated = c.updated_at || c.created_at
        return updated && updated >= thirtyDaysAgo.toISOString()
      }).length

      const resolutionDays = resolvedClosed
        .map((c) => {
          const created = new Date(c.created_at).getTime()
          const updated = new Date(c.updated_at || c.created_at).getTime()
          return (updated - created) / (1000 * 60 * 60 * 24)
        })
        .filter((d) => d >= 0)
      if (resolutionDays.length > 0) {
        complaintMetrics.avgResolutionDays =
          Math.round((resolutionDays.reduce((a, b) => a + b, 0) / resolutionDays.length) * 10) / 10
      }

      const priorityMap = new Map<string, number>()
      complaintRows.forEach((c) => {
        const p = (c.priority || '').trim().toLowerCase() || 'unset'
        priorityMap.set(p, (priorityMap.get(p) || 0) + 1)
      })
      const priorityOrder = ['high', 'medium', 'low', 'unset']
      complaintsByPriority = Array.from(priorityMap.entries())
        .map(([priority, count]) => ({ priority, count }))
        .sort((a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority))

      const templateIdMap = new Map<string | null, number>()
      complaintRows.forEach((c) => {
        const id = c.template_id || null
        templateIdMap.set(id, (templateIdMap.get(id) || 0) + 1)
      })
      const { data: templatesList } = await adminClient
        .from('complaint_master_templates')
        .select('id, name')
        .eq('company_id', companyId)
      const templateNames = new Map<string, string>()
      ;(templatesList || []).forEach((t: { id: string; name: string }) => templateNames.set(t.id, t.name || 'Unknown'))
      complaintsByTemplate = Array.from(templateIdMap.entries())
        .map(([template_id, count]) => ({
          template_id,
          template_name: template_id ? (templateNames.get(template_id) || 'Unknown') : 'No type',
          count,
        }))
        .sort((a, b) => b.count - a.count)

      const productIdMap = new Map<string | null, number>()
      complaintRows.forEach((c) => {
        const id = c.product_id || null
        productIdMap.set(id, (productIdMap.get(id) || 0) + 1)
      })
      const { data: productsList } = await adminClient
        .from('products')
        .select('id, name')
        .eq('company_id', companyId)
      const productNames = new Map<string, string>()
      ;(productsList || []).forEach((p: { id: string; name: string }) => productNames.set(p.id, p.name || 'Unknown'))
      complaintsByProduct = Array.from(productIdMap.entries())
        .map(([product_id, count]) => ({
          product_id,
          product_name: product_id ? (productNames.get(product_id) || 'Unknown') : 'No product',
          count,
        }))
        .sort((a, b) => b.count - a.count)

      const facilityIdMap = new Map<string | null, number>()
      complaintRows.forEach((c) => {
        const id = c.facility_id || null
        facilityIdMap.set(id, (facilityIdMap.get(id) || 0) + 1)
      })
      const { data: facilitiesList } = await adminClient
        .from('facilities')
        .select('id, name')
        .eq('company_id', companyId)
      const facilityNames = new Map<string, string>()
      ;(facilitiesList || []).forEach((f: { id: string; name: string }) => facilityNames.set(f.id, f.name || 'Unknown'))
      complaintsByFacility = Array.from(facilityIdMap.entries())
        .map(([facility_id, count]) => ({
          facility_id,
          facility_name: facility_id ? (facilityNames.get(facility_id) || 'Unknown') : 'No facility',
          count,
        }))
        .sort((a, b) => b.count - a.count)

      const agingBuckets = [
        { key: '0-7', label: '0–7 days', min: 0, max: 7 },
        { key: '7-14', label: '7–14 days', min: 7, max: 14 },
        { key: '14-30', label: '14–30 days', min: 14, max: 30 },
        { key: '30+', label: '30+ days', min: 30, max: Infinity },
      ]
      const openComplaints = complaintRows.filter((c) =>
        openStatuses.includes((c.status || '').toLowerCase())
      )
      const agingCounts = new Map<string, number>()
      agingBuckets.forEach((b) => agingCounts.set(b.key, 0))
      openComplaints.forEach((c) => {
        const days = (Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24)
        const b = agingBuckets.find((x) => days >= x.min && days < x.max) || agingBuckets[3]
        agingCounts.set(b.key, (agingCounts.get(b.key) || 0) + 1)
      })
      complaintsAging = agingBuckets.map((b) => ({
        bucket: b.key,
        label: b.label,
        count: agingCounts.get(b.key) || 0,
      }))

      const resBuckets = [
        { key: '0-3', label: '0–3 days', min: 0, max: 3 },
        { key: '3-7', label: '3–7 days', min: 3, max: 7 },
        { key: '7-14', label: '7–14 days', min: 7, max: 14 },
        { key: '14-30', label: '14–30 days', min: 14, max: 30 },
        { key: '30+', label: '30+ days', min: 30, max: Infinity },
      ]
      const resCounts = new Map<string, number>()
      resBuckets.forEach((b) => resCounts.set(b.key, 0))
      resolvedClosed.forEach((c) => {
        const created = new Date(c.created_at).getTime()
        const updated = new Date(c.updated_at || c.created_at).getTime()
        const days = (updated - created) / (1000 * 60 * 60 * 24)
        const b = resBuckets.find((x) => days >= x.min && days < x.max) || resBuckets[4]
        resCounts.set(b.key, (resCounts.get(b.key) || 0) + 1)
      })
      resolutionTimeBuckets = resBuckets.map((b) => ({
        bucket: b.key,
        label: b.label,
        count: resCounts.get(b.key) || 0,
      }))

      const resolvedTimelineMap = new Map<string, number>()
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        resolvedTimelineMap.set(d.toISOString().split('T')[0], 0)
      }
      resolvedClosed.forEach((c) => {
        const updated = c.updated_at || c.created_at
        if (!updated || updated < thirtyDaysAgo.toISOString()) return
        const dateStr = new Date(updated).toISOString().split('T')[0]
        if (resolvedTimelineMap.has(dateStr)) {
          resolvedTimelineMap.set(dateStr, (resolvedTimelineMap.get(dateStr) || 0) + 1)
        }
      })
      complaintsTimelineResolved = Array.from(resolvedTimelineMap.entries()).map(([date, count]) => ({ date, count }))
    } catch (e) {
      console.error('Extended complaint metrics error:', e)
    }
    
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
      complaintMetrics,
      complaintsByPriority,
      complaintsByTemplate,
      complaintsByProduct,
      complaintsByFacility,
      complaintsAging,
      resolutionTimeBuckets,
      complaintsTimelineResolved,
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
