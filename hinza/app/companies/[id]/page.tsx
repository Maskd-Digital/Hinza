import { redirect, notFound } from 'next/navigation'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { hasPermission } from '@/lib/auth/permissions'
import { getCompanyById, getCompanyStats } from '@/lib/api/companies'
import DashboardLayout from '@/components/DashboardLayout'
import CompanyProfile from '@/features/companies/components/CompanyProfile'

interface CompanyPageProps {
  params: Promise<{ id: string }>
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const user = await getUserWithRoles()
  const { id } = await params

  if (!user) {
    redirect('/login')
  }

  // Check permission
  if (!hasPermission(user.permissions, 'companies:read')) {
    redirect('/unauthorized')
  }

  const company = await getCompanyById(id)
  if (!company) {
    notFound()
  }

  const stats = await getCompanyStats(id)

  return (
    <DashboardLayout permissions={user.permissions}>
      <CompanyProfile
        company={company}
        stats={stats}
        userPermissions={user.permissions}
      />
    </DashboardLayout>
  )
}
