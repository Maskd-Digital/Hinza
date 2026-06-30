import { getCompanyById } from '@/lib/api/companies'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { isOperationsManager } from '@/lib/auth/operations-manager'
import QAManagerDashboard from '@/features/qa-manager/components/QAManagerDashboard'

interface QAManagerDashboardPageProps {
  params: Promise<{ companyId: string }>
}

export default async function QAManagerDashboardPage({
  params,
}: QAManagerDashboardPageProps) {
  const { companyId } = await params
  const user = await getUserWithRoles()
  const company = await getCompanyById(companyId)

  if (!company) {
    return null
  }

  const opsManager = user ? isOperationsManager(user) : false

  return (
    <QAManagerDashboard
      companyId={companyId}
      companyName={company.name}
      isOperationsManager={opsManager}
    />
  )
}
