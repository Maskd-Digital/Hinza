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
      <div className="min-h-full p-6" style={{ backgroundColor: '#EFF4FF' }}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#081636]">Users & Roles Management</h1>
            <p className="text-sm text-[#081636] mt-1">
              {isSuperAdmin 
                ? 'Manage all users and roles across the system' 
                : 'Manage users in your company'
              }
            </p>
          </div>
          {hasPermission(user.permissions, 'users:create') && (
            <a
              href="/users/new-regular"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-colors"
              style={{ backgroundColor: '#0108B8', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Create User
            </a>
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
