import { getCompanyById } from '@/lib/api/companies'
import QAManagerDashboard from '@/features/qa-manager/components/QAManagerDashboard'

interface QAManagerDashboardPageProps {
  params: Promise<{ companyId: string }>
}

export default async function QAManagerDashboardPage({
  params,
}: QAManagerDashboardPageProps) {
  const { companyId } = await params
  const company = await getCompanyById(companyId)

  if (!company) {
    return null
  }

  return (
    <QAManagerDashboard
      companyId={companyId}
      companyName={company.name}
    />
  )
}
