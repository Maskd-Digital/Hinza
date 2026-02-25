'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { hasPermission } from '@/lib/auth/permissions'
import { Permission } from '@/types/auth'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface CompanyAdminSidebarProps {
  permissions: Permission[]
  companyId: string
  companyName: string
}

export default function CompanyAdminSidebar({
  permissions,
  companyId,
  companyName,
}: CompanyAdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const canViewUsers = hasPermission(permissions, 'users:read')
  const canCreateUsers = hasPermission(permissions, 'users:create')
  const canViewProducts = hasPermission(permissions, 'products:read')
  const canViewTemplates = hasPermission(permissions, 'templates:read')
  const canViewComplaints = hasPermission(permissions, 'complaints:read')
  const canViewFacilities = hasPermission(permissions, 'facilities:read')

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isActive = (path: string) => {
    if (path === `/company-admin/${companyId}`) {
      return pathname === `/company-admin/${companyId}`
    }
    return pathname.startsWith(path)
  }

  const basePath = `/company-admin/${companyId}`

  return (
    <aside className="w-64 border-r border-gray-200" style={{ backgroundColor: '#0108B8' }}>
      <div className="flex h-full flex-col">
        {/* Company Header */}
        <div className="p-4" style={{ backgroundColor: '#0108B8' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-white">
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
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-semibold text-white">
                {companyName}
              </h2>
              <p className="text-xs text-white/80">Company Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col min-h-0 pt-4 pr-4 pb-4 pl-0">
          <div className="flex-1 overflow-y-auto space-y-6">
          {/* Dashboard Link */}
          <div>
            <Link
              href={basePath}
              className={`flex items-center gap-3 rounded-r-lg px-3 py-2 text-sm font-medium pl-6 ${
                isActive(basePath) && !pathname.includes('/users')
                  ? 'text-[#081636]'
                  : 'text-white hover:bg-white/10 hover:text-white'
              }`}
              style={isActive(basePath) && !pathname.includes('/users') ? { backgroundColor: '#EFF4FF', boxShadow: 'inset 0 2px 4px rgba(1, 8, 184, 0.25)' } : undefined}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Dashboard
            </Link>
          </div>

          {/* User Management */}
          {canViewUsers && (
            <div className="space-y-6">
              <Link
                href={`${basePath}/users`}
                className={`flex items-center gap-3 rounded-r-lg px-3 py-2 text-sm font-medium pl-6 ${
                  pathname === `${basePath}/users`
                    ? 'text-[#081636]'
                    : 'text-white hover:bg-white/10 hover:text-white'
                }`}
                style={pathname === `${basePath}/users` ? { backgroundColor: '#EFF4FF', boxShadow: 'inset 0 2px 4px rgba(1, 8, 184, 0.25)' } : undefined}
              >
                <svg
                  className="h-5 w-5"
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
                View Users
              </Link>
              {canCreateUsers && (
                <Link
                  href={`${basePath}/users/new`}
                  className={`flex items-center gap-3 rounded-r-lg px-3 py-2 text-sm font-medium pl-6 ${
                    pathname === `${basePath}/users/new`
                      ? 'text-[#081636]'
                      : 'text-white hover:bg-white/10 hover:text-white'
                  }`}
                  style={pathname === `${basePath}/users/new` ? { backgroundColor: '#EFF4FF', boxShadow: 'inset 0 2px 4px rgba(1, 8, 184, 0.25)' } : undefined}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                  Create User
                </Link>
              )}
            </div>
          )}

          {/* Products */}
          {canViewProducts && (
            <div>
              <Link
                href={`${basePath}/products`}
                className={`flex items-center gap-3 rounded-r-lg px-3 py-2 text-sm font-medium pl-6 ${
                  pathname.includes('/products')
                    ? 'text-[#081636]'
                    : 'text-white hover:bg-white/10 hover:text-white'
                }`}
                style={pathname.includes('/products') ? { backgroundColor: '#EFF4FF', boxShadow: 'inset 0 2px 4px rgba(1, 8, 184, 0.25)' } : undefined}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                View Products
              </Link>
            </div>
          )}

          {/* Templates */}
          {canViewTemplates && (
            <div>
              <Link
                href={`${basePath}/templates`}
                className={`flex items-center gap-3 rounded-r-lg px-3 py-2 text-sm font-medium pl-6 ${
                  pathname.includes('/templates')
                    ? 'text-[#081636]'
                    : 'text-white hover:bg-white/10 hover:text-white'
                }`}
                style={pathname.includes('/templates') ? { backgroundColor: '#EFF4FF', boxShadow: 'inset 0 2px 4px rgba(1, 8, 184, 0.25)' } : undefined}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                  />
                </svg>
                View Templates
              </Link>
            </div>
          )}

          {/* Complaints */}
          {canViewComplaints && (
            <div>
              <Link
                href={`${basePath}/complaints`}
                className={`flex items-center gap-3 rounded-r-lg px-3 py-2 text-sm font-medium pl-6 ${
                  pathname.includes('/complaints')
                    ? 'text-[#081636]'
                    : 'text-white hover:bg-white/10 hover:text-white'
                }`}
                style={pathname.includes('/complaints') ? { backgroundColor: '#EFF4FF', boxShadow: 'inset 0 2px 4px rgba(1, 8, 184, 0.25)' } : undefined}
              >
                <svg
                  className="h-5 w-5"
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
                View Complaints
              </Link>
            </div>
          )}

          {/* Facilities */}
          {canViewFacilities && (
            <div>
              <Link
                href={`${basePath}/facilities`}
                className={`flex items-center gap-3 rounded-r-lg px-3 py-2 text-sm font-medium pl-6 ${
                  pathname.includes('/facilities')
                    ? 'text-[#081636]'
                    : 'text-white hover:bg-white/10 hover:text-white'
                }`}
                style={pathname.includes('/facilities') ? { backgroundColor: '#EFF4FF', boxShadow: 'inset 0 2px 4px rgba(1, 8, 184, 0.25)' } : undefined}
              >
                <svg
                  className="h-5 w-5"
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
                View Facilities
              </Link>
            </div>
          )}

          {/* Reports */}
          {canViewReports && (
            <div>
              <Link
                href={`${basePath}/reports`}
                className={`flex items-center gap-3 rounded-r-lg px-3 py-2 text-sm font-medium pl-6 ${
                  pathname.includes('/reports')
                    ? 'text-[#081636]'
                    : 'text-white hover:bg-white/10 hover:text-white'
                }`}
                style={pathname.includes('/reports') ? { backgroundColor: '#EFF4FF', boxShadow: 'inset 0 2px 4px rgba(1, 8, 184, 0.25)' } : undefined}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Analytics
              </Link>
            </div>
          )}

          </div>

          {/* Logout - pinned to bottom */}
          <div className="flex-shrink-0 pt-8 mt-auto">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-r-lg px-3 py-2 text-left text-sm font-medium pl-6 hover:bg-white/10 transition-colors"
              style={{ color: '#FF4242' }}
            >
              <svg
                className="h-5 w-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </nav>
      </div>
    </aside>
  )
}
