import { redirect } from 'next/navigation'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { getCompanyById } from '@/lib/api/companies'
import { hasAnyPermission, hasPermission } from '@/lib/auth/permissions'
import { createAdminClient } from '@/lib/supabase/admin'
import CompanyAdminLayout from '@/features/company-admin/components/CompanyAdminLayout'
import { ComplaintDetailPage } from '@/features/complaints/components'

interface ComplaintDetailRouteProps {
  params: Promise<{ companyId: string; complaintId: string }>
}

export default async function CompanyAdminComplaintDetailPage({
  params,
}: ComplaintDetailRouteProps) {
  const { companyId, complaintId } = await params
  const user = await getUserWithRoles()

  if (!user) redirect('/login')
  if (!user.is_active) redirect('/login?error=account_deactivated')

  const isSuperAdmin = hasAnyPermission(user.permissions, ['companies:read', 'companies:update'])
  const belongsToCompany = user.company_id === companyId
  const canViewComplaints = hasPermission(user.permissions, 'complaints:read')

  if ((!isSuperAdmin && !belongsToCompany) || !canViewComplaints) {
    redirect('/unauthorized')
  }

  const company = await getCompanyById(companyId)
  if (!company) redirect('/unauthorized')

  const adminClient = createAdminClient()
  const { data: complaint } = await adminClient
    .from('complaints')
    .select('id, company_id')
    .eq('id', complaintId)
    .single()

  if (!complaint || complaint.company_id !== companyId) {
    redirect('/unauthorized')
  }

  return (
    <CompanyAdminLayout
      permissions={user.permissions}
      companyId={companyId}
      companyName={company.name}
    >
      <ComplaintDetailPage
        complaintId={complaintId}
        companyId={companyId}
        companyName={company.name}
        user={{
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          permissions: user.permissions,
        }}
        userRole="company_admin"
        backHref={`/company-admin/${companyId}/complaints`}
        backLabel="Back to complaints"
      />
    </CompanyAdminLayout>
  )
}
