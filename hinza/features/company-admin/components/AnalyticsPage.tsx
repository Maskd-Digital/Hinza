'use client'

import { useState, useEffect } from 'react'
import { CompanyAdminStats } from '@/app/api/company-admin/stats/route'
import DonutChart from './charts/DonutChart'
import BarChart from './charts/BarChart'
import HorizontalBarChart from './charts/HorizontalBarChart'

interface AnalyticsPageProps {
  companyId: string
  companyName: string
}

export default function AnalyticsPage({
  companyId,
  companyName,
}: AnalyticsPageProps) {
  const [stats, setStats] = useState<CompanyAdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
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
        <p className="text-red-800">{error || 'Failed to load analytics'}</p>
      </div>
    )
  }

  const complaintsStatusData = [
    { label: 'Pending', value: stats.complaintsByStatus.pending, color: '#f59e0b' },
    { label: 'In Progress', value: stats.complaintsByStatus.in_progress, color: '#3b82f6' },
    { label: 'Resolved', value: stats.complaintsByStatus.resolved, color: '#10b981' },
    { label: 'Closed', value: stats.complaintsByStatus.closed, color: '#6b7280' },
  ]

  const usersStatusData = [
    { label: 'Active', value: stats.activeUsersCount, color: '#10b981' },
    { label: 'Inactive', value: stats.inactiveUsersCount, color: '#ef4444' },
  ]

  const complaintsTimelineData = stats.complaintsTimeline.map((item) => ({
    label: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: item.count,
    color: '#3b82f6',
  }))

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#081636]">Analytics</h1>
        <p className="text-sm text-[#081636]">Reports and insights for {companyName}</p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Complaints by Status */}
        <div className="rounded-xl bg-white p-6" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
          <h3 className="mb-4 text-lg font-semibold text-[#081636]">
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
          <h3 className="mb-4 text-lg font-semibold text-[#081636]">
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
        <h3 className="mb-4 text-lg font-semibold text-[#081636]">
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

      {/* Users by Role & Product Hierarchy */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
          <h3 className="mb-4 text-lg font-semibold text-[#081636]">
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
            <p className="italic text-sm text-[#081636]">No roles defined yet</p>
          )}
        </div>

        <div className="rounded-xl bg-white p-6" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
          <h3 className="mb-4 text-lg font-semibold text-[#081636]">
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
            <p className="italic text-sm text-[#081636]">No products added yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
