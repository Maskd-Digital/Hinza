import { redirect } from 'next/navigation'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { getCompanyById } from '@/lib/api/companies'
import { isQAManager } from '@/lib/auth/qa-manager'
import QAManagerComplaintsPage from '@/features/qa-manager/components/QAManagerComplaintsPage'

interface QAManagerComplaintsPageProps {
  params: Promise<{ companyId: string }>
}

export default async function QAManagerComplaintsRoute({
  params,
}: QAManagerComplaintsPageProps) {
  const { companyId } = await params
  const user = await getUserWithRoles()

  if (!user) {
    redirect('/login')
  }

  if (!user.is_active) {
    redirect('/login?error=account_deactivated')
  }

  if (!isQAManager(user)) {
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
    <QAManagerComplaintsPage
      companyId={companyId}
      companyName={company.name}
      userPermissions={user.permissions}
    />
  )
}
