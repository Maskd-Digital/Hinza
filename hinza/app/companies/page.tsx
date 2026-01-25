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
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Companies</h1>
          {hasPermission(user.permissions, 'companies:create') && (
            <a
              href="/companies/new"
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
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
