import { redirect } from 'next/navigation'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { getCompanyById } from '@/lib/api/companies'
import { hasAnyPermission, hasPermission } from '@/lib/auth/permissions'
import CompanyAdminLayout from '@/features/company-admin/components/CompanyAdminLayout'
import UsersListPage from '@/features/company-admin/components/UsersListPage'

interface UsersPageProps {
  params: Promise<{ companyId: string }>
}

export default async function UsersPage({ params }: UsersPageProps) {
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
  const canViewUsers = hasPermission(user.permissions, 'users:read')

  if ((!isSuperAdmin && !belongsToCompany) || !canViewUsers) {
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
      <UsersListPage 
        companyId={companyId} 
        canCreateUsers={hasPermission(user.permissions, 'users:create')}
      />
    </CompanyAdminLayout>
  )
}
