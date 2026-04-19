import { redirect } from 'next/navigation'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { isFacilityManager } from '@/lib/auth/facility-manager'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ companyId: string }>
}

/**
 * Facility-scoped roles must not use the company admin / management surface.
 * They are redirected to the facility manager dashboard for their company.
 */
export default async function CompanyAdminSegmentLayout({ children, params }: LayoutProps) {
  const { companyId } = await params
  const user = await getUserWithRoles()

  if (user?.is_active && isFacilityManager(user) && user.company_id === companyId) {
    redirect(`/facility-manager/${companyId}`)
  }

  return <>{children}</>
}
