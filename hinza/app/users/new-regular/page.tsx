import { redirect } from 'next/navigation'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { hasPermission } from '@/lib/auth/permissions'
import CreateRegularUserForm from '@/features/users/components/CreateRegularUserForm'
import DashboardLayout from '@/components/DashboardLayout'

export default async function NewRegularUserPage() {
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
        <h1 className="mb-6 text-2xl font-semibold">Create User</h1>
        <CreateRegularUserForm />
      </div>
    </DashboardLayout>
  )
}
