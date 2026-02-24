import { redirect } from 'next/navigation'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { hasPermission } from '@/lib/auth/permissions'
import { getCompanies } from '@/lib/api/companies'
import CompaniesList from '@/features/companies/components/CompaniesList'
import DashboardLayout from '@/components/DashboardLayout'

export default async function CompaniesPage() {
  const user = await getUserWithRoles()

  if (!user) {
    redirect('/login')
  }

  // Check permission
  if (!hasPermission(user.permissions, 'companies:read')) {
    redirect('/unauthorized')
  }

  const companies = await getCompanies()

  return (
    <DashboardLayout permissions={user.permissions}>
      <div className="min-h-full p-6" style={{ backgroundColor: '#EFF4FF' }}>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#081636]">Companies</h1>
          {hasPermission(user.permissions, 'companies:create') && (
            <a
              href="/companies/new"
              className="rounded-md px-4 py-2 text-white hover:opacity-90 transition-colors"
              style={{ backgroundColor: '#0108B8', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}
            >
              Create Company
            </a>
          )}
        </div>
        <CompaniesList companies={companies} />
      </div>
    </DashboardLayout>
  )
}
