import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Company, CreateCompanyInput, UpdateCompanyInput } from '@/types/company'

export async function getCompanies(): Promise<Company[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch companies: ${error.message}`)
  }

  return data || []
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch company: ${error.message}`)
  }

  return data
}

export async function createCompany(
  input: CreateCompanyInput
): Promise<Company> {
  const supabase = await createClient()

  // Create company
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({
      name: input.name,
    })
    .select()
    .single()

  if (companyError) {
    throw new Error(`Failed to create company: ${companyError.message}`)
  }

  // Create admin user (this would typically be done via Supabase Auth Admin API)
  // For now, we'll return the company and the admin creation should be handled separately
  // TODO: Implement admin user creation via Supabase Auth Admin API
  // The admin should be created in auth.users first, then in users table with appropriate roles

  return company
}

export async function updateCompany(
  id: string,
  input: UpdateCompanyInput
): Promise<Company> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('companies')
    .update({
      name: input.name,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update company: ${error.message}`)
  }

  return data
}

export async function deleteCompany(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('companies').delete().eq('id', id)

  if (error) {
    throw new Error(`Failed to delete company: ${error.message}`)
  }
}

export interface CompanyStats {
  rolesCount: number
  productsCount: number
  complaintsCount: number
  templatesCount: number
  facilitiesCount: number
  complaintsTimeline: Array<{
    date: string
    count: number
  }>
}

export async function getCompanyStats(
  companyId: string
): Promise<CompanyStats> {
  const supabase = await createClient()

  // Get roles count
  const { count: rolesCount } = await supabase
    .from('roles')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)

  // Get products count
  const { count: productsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)

  // Use admin client for complaints (and timeline) so superadmin sees accurate
  // counts for any company; RLS would otherwise restrict by user context.
  const adminClient = createAdminClient()

  // Get complaints count (assuming complaints table exists)
  let complaintsCount = 0
  try {
    const { count } = await adminClient
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
    complaintsCount = count ?? 0
  } catch {
    complaintsCount = 0
  }

  // Get templates count - now from complaint_master_templates with company_id
  const { count: templatesCount } = await supabase
    .from('complaint_master_templates')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)

  // Get facilities count
  let facilitiesCount = 0
  try {
    const { count } = await supabase
      .from('facilities')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
    facilitiesCount = count || 0
  } catch {
    facilitiesCount = 0
  }

  // Get complaints timeline (last 30 days) — admin client for accurate data
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
    complaints = []
  }

  // Group complaints by date
  const timelineMap = new Map<string, number>()
  const today = new Date()

  // Initialize last 30 days with 0
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    timelineMap.set(dateStr, 0)
  }

  // Count complaints per day
  complaints?.forEach((complaint) => {
    const dateStr = new Date(complaint.created_at)
      .toISOString()
      .split('T')[0]
    const current = timelineMap.get(dateStr) || 0
    timelineMap.set(dateStr, current + 1)
  })

  const complaintsTimeline = Array.from(timelineMap.entries()).map(
    ([date, count]) => ({ date, count })
  )

  return {
    rolesCount: rolesCount || 0,
    productsCount: productsCount || 0,
    complaintsCount: complaintsCount || 0,
    templatesCount: templatesCount || 0,
    facilitiesCount: facilitiesCount || 0,
    complaintsTimeline,
  }
}

