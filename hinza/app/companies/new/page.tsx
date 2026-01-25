import { redirect } from 'next/navigation'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { hasPermission } from '@/lib/auth/permissions'
import MultiStepCreateCompany from '@/features/companies/components/MultiStepCreateCompany'
import DashboardLayout from '@/components/DashboardLayout'

export default async function NewCompanyPage() {
  const user = await getUserWithRoles()

  if (!user) {
    redirect('/login')
  }

  if (!hasPermission(user.permissions, 'companies:create')) {
    redirect('/unauthorized')
  }

  return (
    <DashboardLayout permissions={user.permissions}>
      <div className="p-6">
        <h1 className="mb-6 text-2xl font-semibold">Create New Company</h1>
        <MultiStepCreateCompany />
      </div>
    </DashboardLayout>
  )
}
