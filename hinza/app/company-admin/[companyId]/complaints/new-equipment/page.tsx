import { redirect } from 'next/navigation'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { getCompanyById } from '@/lib/api/companies'
import { hasAnyPermission, hasPermission } from '@/lib/auth/permissions'
import CompanyAdminLayout from '@/features/company-admin/components/CompanyAdminLayout'
import NewEquipmentComplaintPage from '@/features/company-admin/components/NewEquipmentComplaintPage'

interface PageProps {
  params: Promise<{ companyId: string }>
}

export default async function NewEquipmentComplaintRoute({ params }: PageProps) {
  const { companyId } = await params
  const user = await getUserWithRoles()

  if (!user) redirect('/login')
  if (!user.is_active) redirect('/login?error=account_deactivated')

  const isSuperAdmin = hasAnyPermission(user.permissions, ['companies:read', 'companies:update'])
  const belongsToCompany = user.company_id === companyId
  const canCreate =
    hasPermission(user.permissions, 'facility_complaints:create') ||
    hasPermission(user.permissions, 'complaints:create')

  if ((!isSuperAdmin && !belongsToCompany) || !canCreate) {
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
      <NewEquipmentComplaintPage companyId={companyId} companyName={company.name} />
    </CompanyAdminLayout>
  )
}
