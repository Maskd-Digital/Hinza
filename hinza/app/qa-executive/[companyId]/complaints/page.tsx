import { redirect } from 'next/navigation'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { getCompanyById } from '@/lib/api/companies'
import { isQAExecutive } from '@/lib/auth/qa-executive'
import QAExecutiveComplaintsPage from '@/features/qa-executive/components/QAExecutiveComplaintsPage'

interface QAExecutiveComplaintsPageProps {
  params: Promise<{ companyId: string }>
}

export default async function QAExecutiveComplaintsRoute({
  params,
}: QAExecutiveComplaintsPageProps) {
  const { companyId } = await params
  const user = await getUserWithRoles()

  if (!user) {
    redirect('/login')
  }

  if (!user.is_active) {
    redirect('/login?error=account_deactivated')
  }

  if (!isQAExecutive(user)) {
    redirect('/unauthorized')
  }

  if (user.company_id !== companyId) {
    redirect('/unauthorized')
  }

  const company = await getCompanyById(companyId)
  if (!company) {
    redirect('/unauthorized')
  }

  return (
    <QAExecutiveComplaintsPage
      companyId={companyId}
      companyName={company.name}
      userId={user.id}
      userPermissions={user.permissions}
    />
  )
}
