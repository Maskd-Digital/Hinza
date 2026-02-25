import { redirect } from 'next/navigation'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { hasPermission } from '@/lib/auth/permissions'
import CreateUserForm from '@/features/users/components/CreateUserForm'
import DashboardLayout from '@/components/DashboardLayout'

export default async function NewUserPage() {
  const user = await getUserWithRoles()

  if (!user) {
    redirect('/login')
  }

  if (!hasPermission(user.permissions, 'users:create')) {
    redirect('/unauthorized')
  }

  return (
    <DashboardLayout permissions={user.permissions}>
      <div className="min-h-full p-6" style={{ backgroundColor: '#EFF4FF' }}>
        <h1 className="mb-[40px] text-2xl font-semibold text-[#081636]">Create Superadmin User</h1>
        <CreateUserForm />
      </div>
    </DashboardLayout>
  )
}
