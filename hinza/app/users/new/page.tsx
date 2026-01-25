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
      <div className="p-6">
        <h1 className="mb-6 text-2xl font-semibold">Create Superadmin User</h1>
        <CreateUserForm />
      </div>
    </DashboardLayout>
  )
}
