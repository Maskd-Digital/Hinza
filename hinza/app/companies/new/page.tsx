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
      <div className="min-h-full p-6" style={{ backgroundColor: '#EFF4FF' }}>
        <h1 className="mb-[40px] text-2xl font-semibold text-[#081636]">Create New Company</h1>
        <MultiStepCreateCompany />
      </div>
    </DashboardLayout>
  )
}
