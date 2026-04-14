import { getCompanyById } from '@/lib/api/companies'
import FacilityManagerDashboard from '@/features/facility-manager/components/FacilityManagerDashboard'

interface PageProps {
  params: Promise<{ companyId: string }>
}

export default async function FacilityManagerHomePage({ params }: PageProps) {
  const { companyId } = await params
  const company = await getCompanyById(companyId)
  if (!company) return null

  return (
    <FacilityManagerDashboard companyId={companyId} companyName={company.name} />
  )
}
