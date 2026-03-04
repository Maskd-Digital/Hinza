import { redirect } from 'next/navigation'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { getCompanyById } from '@/lib/api/companies'
import { isQAExecutive } from '@/lib/auth/qa-executive'
import { createAdminClient } from '@/lib/supabase/admin'
import { ComplaintDetailPage } from '@/features/complaints/components'

interface ComplaintDetailRouteProps {
  params: Promise<{ companyId: string; complaintId: string }>
}

export default async function QAExecutiveComplaintDetailPage({
  params,
}: ComplaintDetailRouteProps) {
  const { companyId, complaintId } = await params
  const user = await getUserWithRoles()

  if (!user) redirect('/login')
  if (!user.is_active) redirect('/login?error=account_deactivated')
  if (!isQAExecutive(user)) redirect('/unauthorized')
  if (user.company_id !== companyId) redirect('/unauthorized')

  const company = await getCompanyById(companyId)
  if (!company) redirect('/unauthorized')

  const adminClient = createAdminClient()
  const { data: complaint } = await adminClient
    .from('complaints')
    .select('id, company_id')
    .eq('id', complaintId)
    .single()

  if (!complaint || complaint.company_id !== companyId) {
    redirect('/unauthorized')
  }

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
      userRole="qa_executive"
      backHref={`/qa-executive/${companyId}/complaints`}
      backLabel="Back to complaints"
    />
  )
}
