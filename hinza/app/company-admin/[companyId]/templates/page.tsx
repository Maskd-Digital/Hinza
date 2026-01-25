import { redirect } from 'next/navigation'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { getCompanyById } from '@/lib/api/companies'
import { hasAnyPermission, hasPermission } from '@/lib/auth/permissions'
import CompanyAdminLayout from '@/features/company-admin/components/CompanyAdminLayout'
import TemplatesListPage from '@/features/company-admin/components/TemplatesListPage'

interface TemplatesPageProps {
  params: Promise<{ companyId: string }>
}

export default async function TemplatesPage({ params }: TemplatesPageProps) {
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
  const canViewTemplates = hasPermission(user.permissions, 'templates:read')

  if ((!isSuperAdmin && !belongsToCompany) || !canViewTemplates) {
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
      <TemplatesListPage
        companyId={companyId}
        canCreateTemplates={hasPermission(user.permissions, 'templates:create')}
      />
    </CompanyAdminLayout>
  )
}
