import FacilityManagerComplaintsPage from '@/features/facility-manager/components/FacilityManagerComplaintsPage'
import { getCompanyById } from '@/lib/api/companies'

interface PageProps {
  params: Promise<{ companyId: string }>
}

export default async function FacilityManagerComplaintsRoute({ params }: PageProps) {
  const { companyId } = await params
  const company = await getCompanyById(companyId)
  if (!company) return null

  return (
    <FacilityManagerComplaintsPage companyId={companyId} companyName={company.name} />
  )
}
