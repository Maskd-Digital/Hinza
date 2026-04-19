import { redirect } from 'next/navigation'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { hasPermission, isSystemAdmin } from '@/lib/auth/permissions'
import { isFacilityManager } from '@/lib/auth/facility-manager'
import { isQAManager } from '@/lib/auth/qa-manager'
import { isOperationsManager } from '@/lib/auth/operations-manager'
import { isQAExecutive } from '@/lib/auth/qa-executive'
import { getDashboardStats } from '@/lib/api/dashboard'
import DashboardLayout from '@/components/DashboardLayout'
import StatCard from '@/components/dashboard/StatCard'
import ComplaintsTimeline from '@/components/dashboard/ComplaintsTimeline'

export default async function DashboardPage() {
  const user = await getUserWithRoles()

  if (!user) {
    redirect('/login')
  }

  // Check if user is active
  if (!user.is_active) {
    redirect('/login?error=account_deactivated')
  }

  // Only system-level users should see this superadmin dashboard
  if (!isSystemAdmin(user.company_id)) {
    if (isOperationsManager(user)) {
      redirect(`/qa-manager/${user.company_id}`)
    }
    if (isQAManager(user)) {
      redirect(`/qa-manager/${user.company_id}`)
    }
    if (isQAExecutive(user)) {
      redirect(`/qa-executive/${user.company_id}`)
    }
    if (isFacilityManager(user)) {
      redirect(`/facility-manager/${user.company_id}`)
    }
    redirect(`/company-admin/${user.company_id}`)
  }

  // Get dashboard stats (only for superadmin)
  const canViewStats = hasPermission(user.permissions, 'dashboard:view') ||
    hasPermission(user.permissions, 'companies:read') // Superadmin check

  let stats = null
  if (canViewStats) {
    try {
      stats = await getDashboardStats()
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    }
  }

  return (
    <DashboardLayout permissions={user.permissions}>
      <div className="min-h-full p-6" style={{ backgroundColor: '#EFF4FF' }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#2563EB' }}>System Administration</h1>
          <p className="mt-1 text-[#081636]">
            Welcome, <span className="font-medium">{user.full_name || user.email}</span> - Managing all companies and system users
          </p>
        </div>

        {/* Dashboard Stats - Only show for superadmin */}
        {canViewStats && stats && (
          <div className="mb-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <StatCard
                title="Active Companies"
                value={stats.activeCompanies}
                icon={
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                }
              />
              <StatCard
                title="Active Users"
                value={stats.activeUsers}
                icon={
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                }
              />
              <StatCard
                title="Total Complaints"
                value={stats.totalComplaints}
                icon={
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                }
              />
            </div>

            {/* Complaints Timeline */}
            <div className="mt-6">
              <ComplaintsTimeline timeline={stats.complaintsTimeline} />
            </div>
          </div>
        )}

        {/* User Roles */}
        <div
          className="rounded-lg border border-gray-200 p-6"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.25), 0 2px 6px -2px rgba(37, 99, 235, 0.25)',
          }}
        >
          <h2 className="text-lg font-semibold text-[#081636]">Your Roles</h2>
          {user.roles.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {user.roles.map((role) => (
                <span
                  key={role.id}
                  className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(37, 99, 235, 0.15)', color: '#2563EB' }}
                >
                  {role.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-[#081636] italic">
              No roles assigned. Please contact administrator.
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
