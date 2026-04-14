import { redirect } from 'next/navigation'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { getCompanyById } from '@/lib/api/companies'
import { isFacilityManager } from '@/lib/auth/facility-manager'
import { hasPermission } from '@/lib/auth/permissions'
import ComplaintDetailPage from '@/features/complaints/components/ComplaintDetailPage'

interface PageProps {
  params: Promise<{ companyId: string; complaintId: string }>
}

export default async function FacilityManagerComplaintDetailRoute({ params }: PageProps) {
  const { companyId, complaintId } = await params
  const user = await getUserWithRoles()

  if (!user) redirect('/login')
  if (!user.is_active) redirect('/login?error=account_deactivated')
  if (!isFacilityManager(user)) redirect('/unauthorized')
  if (!hasPermission(user.permissions, 'facility_complaints:read')) redirect('/unauthorized')
  if (user.company_id !== companyId) redirect('/unauthorized')

  const company = await getCompanyById(companyId)
  if (!company) redirect('/unauthorized')

  return (
    <ComplaintDetailPage
      complaintId={complaintId}
      companyId={companyId}
      companyName={company.name}
      user={{
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        permissions: user.permissions,
      }}
      userRole="facility_manager"
      backHref={`/facility-manager/${companyId}/complaints`}
      backLabel="Back to equipment complaints"
    />
  )
}
