import { redirect } from 'next/navigation'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { getCompanyById } from '@/lib/api/companies'
import { isFacilityManager } from '@/lib/auth/facility-manager'
import { hasPermission } from '@/lib/auth/permissions'
import FacilityManagerLayout from '@/features/facility-manager/components/FacilityManagerLayout'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ companyId: string }>
}

export default async function FacilityManagerLayoutWrapper({
  children,
  params,
}: LayoutProps) {
  const { companyId } = await params
  const user = await getUserWithRoles()

  if (!user) redirect('/login')
  if (!user.is_active) redirect('/login?error=account_deactivated')

  if (!isFacilityManager(user)) redirect('/unauthorized')
  if (!hasPermission(user.permissions, 'facility_complaints:read')) {
    redirect('/unauthorized')
  }
  if (user.company_id !== companyId) redirect('/unauthorized')

  let company
  try {
    company = await getCompanyById(companyId)
  } catch {
    redirect('/unauthorized')
  }
  if (!company) redirect('/unauthorized')

  return (
    <FacilityManagerLayout companyId={companyId} companyName={company.name}>
      {children}
    </FacilityManagerLayout>
  )
}
