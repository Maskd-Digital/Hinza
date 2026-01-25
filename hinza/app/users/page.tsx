import { redirect } from 'next/navigation'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { hasPermission, isSystemAdmin } from '@/lib/auth/permissions'
import { getUsers } from '@/lib/api/users'
import UsersList from '@/features/users/components/UsersList'
import SuperadminUsersList from '@/features/users/components/SuperadminUsersList'
import DashboardLayout from '@/components/DashboardLayout'

export default async function UsersPage() {
  const user = await getUserWithRoles()

  if (!user) {
    redirect('/login')
  }

  if (!hasPermission(user.permissions, 'users:read')) {
    redirect('/unauthorized')
  }

  // Check if user is a superadmin (system-level user with SYSTEM_ADMIN_COMPANY_ID)
  const isSuperAdmin = isSystemAdmin(user.company_id)

  // Company admins can only see users from their company
  // Superadmins can see all
  const companyId = isSuperAdmin ? undefined : user.company_id

  const users = await getUsers(companyId)

  return (
    <DashboardLayout permissions={user.permissions}>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Users & Roles Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              {isSuperAdmin 
                ? 'Manage all users and roles across the system' 
                : 'Manage users in your company'
              }
            </p>
          </div>
          {hasPermission(user.permissions, 'users:create') && (
            <div className="flex gap-3">
              <a
                href="/users/new-regular"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Create User
              </a>
              {isSuperAdmin && (
                <a
                  href="/users/new"
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Create Superadmin
                </a>
              )}
            </div>
          )}
        </div>
        {isSuperAdmin ? (
          <SuperadminUsersList initialUsers={users} />
        ) : (
          <UsersList users={users} />
        )}
      </div>
    </DashboardLayout>
  )
}
