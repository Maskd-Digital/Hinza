import { getCompanyById } from '@/lib/api/companies'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { getFacilityScopeRoleDisplayName } from '@/lib/auth/facility-manager'
import FacilityManagerDashboard from '@/features/facility-manager/components/FacilityManagerDashboard'

interface PageProps {
  params: Promise<{ companyId: string }>
}

export default async function FacilityManagerHomePage({ params }: PageProps) {
  const { companyId } = await params
  const [company, user] = await Promise.all([getCompanyById(companyId), getUserWithRoles()])
  if (!company) return null

  const roleLabel = getFacilityScopeRoleDisplayName(user ?? undefined) ?? 'Facility Manager'

  return (
    <FacilityManagerDashboard
      companyId={companyId}
      companyName={company.name}
      roleLabel={roleLabel}
    />
  )
}
