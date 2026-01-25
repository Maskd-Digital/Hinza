import { redirect } from 'next/navigation'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { getCompanyById } from '@/lib/api/companies'
import { hasAnyPermission } from '@/lib/auth/permissions'
import CompanyAdminLayout from '@/features/company-admin/components/CompanyAdminLayout'
import CompanyAdminDashboard from '@/features/company-admin/components/CompanyAdminDashboard'

interface CompanyAdminPageProps {
  params: Promise<{ companyId: string }>
}

export default async function CompanyAdminPage({ params }: CompanyAdminPageProps) {
  const { companyId } = await params
  const user = await getUserWithRoles()

  if (!user) {
    redirect('/login')
  }

  // Check if user is active
  if (!user.is_active) {
    redirect('/login?error=account_deactivated')
  }

  // Check if user has permission to access this company's admin panel
  // User must either be a superadmin or belong to this company
  const isSuperAdmin = hasAnyPermission(user.permissions, ['companies:read', 'companies:create', 'companies:update', 'companies:delete'])
  const belongsToCompany = user.company_id === companyId

  if (!isSuperAdmin && !belongsToCompany) {
    redirect('/unauthorized')
  }

  // Fetch company details
  let company
  try {
    company = await getCompanyById(companyId)
  } catch {
    redirect('/unauthorized')
  }

  if (!company) {
    redirect('/unauthorized')
  }

  return (
    <CompanyAdminLayout
      permissions={user.permissions}
      companyId={companyId}
      companyName={company.name}
    >
      <CompanyAdminDashboard
        companyId={companyId}
        companyName={company.name}
      />
    </CompanyAdminLayout>
  )
}
