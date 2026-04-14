import { redirect } from 'next/navigation'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { getCompanyById } from '@/lib/api/companies'
import { hasAnyPermission, hasPermission } from '@/lib/auth/permissions'
import CompanyAdminLayout from '@/features/company-admin/components/CompanyAdminLayout'
import ComplaintsListPage from '@/features/company-admin/components/ComplaintsListPage'

interface ComplaintsPageProps {
  params: Promise<{ companyId: string }>
}

export default async function ComplaintsPage({ params }: ComplaintsPageProps) {
  const { companyId } = await params
  const user = await getUserWithRoles()

  if (!user) {
    redirect('/login')
  }

  if (!user.is_active) {
    redirect('/login?error=account_deactivated')
  }

  // Check permissions
  const isSuperAdmin = hasAnyPermission(user.permissions, ['companies:read', 'companies:update'])
  const belongsToCompany = user.company_id === companyId
  const canViewComplaints = hasPermission(user.permissions, 'complaints:read')

  if ((!isSuperAdmin && !belongsToCompany) || !canViewComplaints) {
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
      <ComplaintsListPage
        companyId={companyId}
        canCreateComplaints={hasPermission(user.permissions, 'complaints:create')}
        canAssignComplaints={hasPermission(user.permissions, 'complaints:assign')}
        canCreateFacilityEquipmentComplaint={
          hasPermission(user.permissions, 'facility_complaints:create') ||
          hasPermission(user.permissions, 'complaints:create')
        }
      />
    </CompanyAdminLayout>
  )
}
