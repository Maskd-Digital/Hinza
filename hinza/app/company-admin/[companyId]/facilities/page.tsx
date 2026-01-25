import { redirect } from 'next/navigation'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { getCompanyById } from '@/lib/api/companies'
import { hasAnyPermission, hasPermission } from '@/lib/auth/permissions'
import CompanyAdminLayout from '@/features/company-admin/components/CompanyAdminLayout'
import FacilitiesListPage from '@/features/company-admin/components/FacilitiesListPage'

interface FacilitiesPageProps {
  params: Promise<{ companyId: string }>
}

export default async function FacilitiesPage({ params }: FacilitiesPageProps) {
  const { companyId } = await params
  const user = await getUserWithRoles()

  if (!user) {
    redirect('/login')
  }

  if (!user.is_active) {
    redirect('/login?error=account_deactivated')
  }

  // Check permissions
  const isSuperAdmin = hasAnyPermission(user.permissions, [
    'companies:read',
    'companies:update',
  ])
  const belongsToCompany = user.company_id === companyId
  const canViewFacilities = hasPermission(user.permissions, 'facilities:read')

  if ((!isSuperAdmin && !belongsToCompany) || !canViewFacilities) {
    redirect('/unauthorized')
  }

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
      <FacilitiesListPage
        companyId={companyId}
        companyName={company.name}
        userPermissions={user.permissions}
      />
    </CompanyAdminLayout>
  )
}
