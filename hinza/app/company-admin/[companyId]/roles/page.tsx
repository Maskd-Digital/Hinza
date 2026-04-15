import { redirect } from 'next/navigation'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { getCompanyById } from '@/lib/api/companies'
import { hasAnyPermission, hasPermission } from '@/lib/auth/permissions'
import CompanyAdminLayout from '@/features/company-admin/components/CompanyAdminLayout'
import ManageRolesPage from '@/features/company-admin/components/ManageRolesPage'

interface RolesPageProps {
  params: Promise<{ companyId: string }>
}

export default async function RolesPage({ params }: RolesPageProps) {
  const { companyId } = await params
  const user = await getUserWithRoles()

  if (!user) {
    redirect('/login')
  }

  if (!user.is_active) {
    redirect('/login?error=account_deactivated')
  }

  const isSuperAdmin = hasAnyPermission(user.permissions, [
    'companies:read',
    'companies:update',
  ])
  const belongsToCompany = user.company_id === companyId
  const canViewRoles = hasPermission(user.permissions, 'roles:read')
  const canUpdateRoles = hasPermission(user.permissions, 'roles:update')
  const canCreateRoles = hasPermission(user.permissions, 'roles:create')
  const canCreateUsers = hasPermission(user.permissions, 'users:create')

  if ((!isSuperAdmin && !belongsToCompany) || !canViewRoles) {
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
      <ManageRolesPage
        companyId={companyId}
        canUpdateRoles={canUpdateRoles}
        canCreateRoles={canCreateRoles}
        canBulkAssignUsers={canCreateUsers}
      />
    </CompanyAdminLayout>
  )
}
