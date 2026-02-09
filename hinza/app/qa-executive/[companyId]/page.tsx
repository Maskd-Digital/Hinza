import { getCompanyById } from '@/lib/api/companies'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import QAExecutiveDashboard from '@/features/qa-executive/components/QAExecutiveDashboard'

interface QAExecutiveDashboardPageProps {
  params: Promise<{ companyId: string }>
}

export default async function QAExecutiveDashboardPage({
  params,
}: QAExecutiveDashboardPageProps) {
  const { companyId } = await params
  const user = await getUserWithRoles()
  const company = await getCompanyById(companyId)

  if (!user || !company) {
    return null
  }

  return (
    <QAExecutiveDashboard
      companyId={companyId}
      companyName={company.name}
      userId={user.id}
    />
  )
}
