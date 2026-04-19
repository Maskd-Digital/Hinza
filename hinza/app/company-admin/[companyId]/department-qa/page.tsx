import { redirect } from 'next/navigation'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { getCompanyById } from '@/lib/api/companies'
import { hasAnyPermission, hasPermission } from '@/lib/auth/permissions'
import CompanyAdminLayout from '@/features/company-admin/components/CompanyAdminLayout'
import DepartmentQaAssignmentsPage from '@/features/company-admin/components/DepartmentQaAssignmentsPage'

interface PageProps {
  params: Promise<{ companyId: string }>
}

export default async function DepartmentQaRoute({ params }: PageProps) {
  const { companyId } = await params
  const user = await getUserWithRoles()

  if (!user) redirect('/login')
  if (!user.is_active) redirect('/login?error=account_deactivated')

  const isSuperAdmin = hasAnyPermission(user.permissions, ['companies:read', 'companies:update'])
  const belongsToCompany = user.company_id === companyId
  const canAssign = hasPermission(user.permissions, 'department_qa:assign')

  if ((!isSuperAdmin && !belongsToCompany) || !canAssign) {
    redirect('/unauthorized')
  }

  const company = await getCompanyById(companyId)
  if (!company) redirect('/unauthorized')

  return (
    <CompanyAdminLayout
      permissions={user.permissions}
      companyId={companyId}
      companyName={company.name}
    >
      <DepartmentQaAssignmentsPage
        companyId={companyId}
        companyName={company.name}
        userPermissions={user.permissions}
      />
    </CompanyAdminLayout>
  )
}
