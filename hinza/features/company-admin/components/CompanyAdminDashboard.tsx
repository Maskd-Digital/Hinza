'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CompanyAdminStats } from '@/app/api/company-admin/stats/route'
import MiniStatCard from './charts/MiniStatCard'
import ViewUsersModal from './ViewUsersModal'
import InviteUserModal from './InviteUserModal'

interface CompanyAdminDashboardProps {
  companyId: string
  companyName: string
}

export default function CompanyAdminDashboard({
  companyId,
  companyName,
}: CompanyAdminDashboardProps) {
  const router = useRouter()
  const [stats, setStats] = useState<CompanyAdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isViewUsersModalOpen, setIsViewUsersModalOpen] = useState(false)
  const [isInviteUserModalOpen, setIsInviteUserModalOpen] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [companyId])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/company-admin/stats?company_id=${companyId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="rounded-lg bg-red-50 p-6" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
        <p className="text-red-800">{error || 'Failed to load dashboard'}</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#081636]">Dashboard</h1>
          <p className="text-sm text-[#081636]">Overview for {companyName}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsInviteUserModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: '#0108B8', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Add User
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <MiniStatCard
          title="Total Users"
          value={stats.usersCount}
          color="blue"
          onClick={() => setIsViewUsersModalOpen(true)}
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <MiniStatCard
          title="Active Users"
          value={stats.activeUsersCount}
          subtitle={`${stats.usersCount > 0 ? Math.round((stats.activeUsersCount / stats.usersCount) * 100) : 0}% of total`}
          color="green"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MiniStatCard
          title="Products"
          value={stats.productsCount}
          subtitle={`${stats.rootProductsCount} categories`}
          color="purple"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
        <MiniStatCard
          title="Templates"
          value={stats.templatesCount}
          color="amber"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
            </svg>
          }
        />
        <MiniStatCard
          title="Complaints"
          value={stats.complaintsCount}
          color="red"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <MiniStatCard
          title="Roles"
          value={stats.rolesCount}
          color="gray"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Complaints by Status */}
        <div className="rounded-xl bg-white p-6" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
          <h3 className="text-lg font-semibold text-[#081636] mb-4">
            Complaints by Status
          </h3>
          <div className="flex items-center justify-center gap-8">
            <DonutChart
              data={complaintsStatusData}
              centerLabel="Total"
              size={180}
            />
            <div className="space-y-2">
              {complaintsStatusData.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-[#081636]">{item.label}</span>
                  <span className="text-sm font-medium text-[#081636]">
                    ({item.value})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Status */}
        <div className="rounded-xl bg-white p-6" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
          <h3 className="text-lg font-semibold text-[#081636] mb-4">
            User Status
          </h3>
          <div className="flex items-center justify-center gap-8">
            <DonutChart
              data={usersStatusData}
              centerLabel="Users"
              size={180}
            />
            <div className="space-y-3">
              {usersStatusData.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <span className="text-sm font-medium text-[#081636]">
                      {item.value}
                    </span>
                    <span className="ml-2 text-sm text-[#081636]">
                      {item.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Complaints Timeline */}
      <div className="rounded-xl bg-white p-6" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
<h3 className="text-lg font-semibold text-[#081636] mb-4">
        Complaints Timeline (Last 30 Days)
        </h3>
        <BarChart
          data={complaintsTimelineData}
          height={150}
          showLabels={false}
        />
        <div className="mt-2 flex justify-between text-xs text-[#081636]">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>

      {/* Bottom Grid - Users by Role & Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Users by Role */}
        <div className="rounded-xl bg-white p-6" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
          <h3 className="text-lg font-semibold text-[#081636] mb-4">
            Users by Role
          </h3>
          {stats.usersByRole.length > 0 ? (
            <HorizontalBarChart
              data={stats.usersByRole.map((r) => ({
                label: r.role_name,
                value: r.count,
              }))}
            />
          ) : (
            <p className="text-sm text-[#081636] italic">No roles defined yet</p>
          )}
        </div>

        {/* Product Hierarchy */}
        <div className="rounded-xl bg-white p-6" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
          <h3 className="text-lg font-semibold text-[#081636] mb-4">
            Product Hierarchy
          </h3>
          {stats.productsByLevel.length > 0 ? (
            <HorizontalBarChart
              data={stats.productsByLevel.map((p) => ({
                label: p.level === 0 ? 'Root Categories' : `Level ${p.level}`,
                value: p.count,
                color: p.level === 0 ? '#8b5cf6' : p.level === 1 ? '#3b82f6' : '#10b981',
              }))}
            />
          ) : (
            <p className="text-sm text-[#081636] italic">No products added yet</p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <div className="rounded-xl bg-white p-6" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#081636]">Recent Users</h3>
            <button
              onClick={() => setIsViewUsersModalOpen(true)}
              className="text-sm hover:opacity-80"
              style={{ color: '#2563EB' }}
            >
              View all
            </button>
          </div>
          {stats.recentUsers.length > 0 ? (
            <div className="space-y-3">
              {stats.recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                      {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#081636]">
                        {user.full_name || 'No name'}
                      </p>
                      <p className="text-xs text-[#081636]">{user.email}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#081636] italic">No users yet</p>
          )}
        </div>

        {/* Recent Complaints */}
        <div className="rounded-xl bg-white p-6" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#081636]">
              Recent Complaints
            </h3>
            <button className="text-sm hover:opacity-80" style={{ color: '#2563EB' }}>
              View all
            </button>
          </div>
          {stats.recentComplaints.length > 0 ? (
            <div className="space-y-3">
              {stats.recentComplaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#081636]">
                      {complaint.title}
                    </p>
                    <p className="text-xs text-[#081636]">
                      {new Date(complaint.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`ml-3 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      complaint.status === 'resolved'
                        ? 'bg-green-100 text-green-700'
                        : complaint.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-700'
                        : complaint.status === 'closed'
                        ? 'bg-gray-100 text-[#081636]'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {complaint.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#081636] italic">No complaints yet</p>
          )}
        </div>
      </div>

      {/* Modals */}
      <ViewUsersModal
        isOpen={isViewUsersModalOpen}
        onClose={() => setIsViewUsersModalOpen(false)}
        companyId={companyId}
      />
      <InviteUserModal
        isOpen={isInviteUserModalOpen}
        onClose={() => setIsInviteUserModalOpen(false)}
        companyId={companyId}
        onSuccess={() => {
          setIsInviteUserModalOpen(false)
          fetchStats()
          router.refresh()
        }}
      />
    </div>
  )
}
