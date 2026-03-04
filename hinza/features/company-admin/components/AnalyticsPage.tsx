'use client'

import { useState, useEffect } from 'react'
import { CompanyAdminStats } from '@/app/api/company-admin/stats/route'
import { exportAnalyticsToPdf } from '@/lib/export-analytics-pdf'
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

  const m = stats.complaintMetrics
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

  const handleExportPdf = () => {
    exportAnalyticsToPdf(stats, companyName)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#081636]">Analytics</h1>
          <p className="text-sm text-[#081636]">Reports and insights for {companyName}</p>
        </div>
        <button
          type="button"
          onClick={handleExportPdf}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-md transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:shadow-inner active:bg-blue-800"
          style={{ boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3), 0 2px 4px -2px rgba(37, 99, 235, 0.2)' }}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export PDF
        </button>
      </div>

      {/* Complaint KPI cards */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-[#081636]">Complaints overview</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-white p-4" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Open backlog</p>
            <p className="mt-1 text-2xl font-bold text-[#081636]">{m.openBacklog}</p>
            <p className="text-xs text-gray-500">Pending + In progress</p>
          </div>
          <div className="rounded-xl bg-white p-4" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Overdue</p>
            <p className="mt-1 text-2xl font-bold text-[#081636]">{m.overdue}</p>
            <p className="text-xs text-gray-500">Past deadline</p>
          </div>
          <div className="rounded-xl bg-white p-4" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Resolved (30d)</p>
            <p className="mt-1 text-2xl font-bold text-[#081636]">{m.resolvedLast30Days}</p>
            <p className="text-xs text-gray-500">Last 30 days</p>
          </div>
          <div className="rounded-xl bg-white p-4" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Avg resolution</p>
            <p className="mt-1 text-2xl font-bold text-[#081636]">
              {m.avgResolutionDays != null ? `${m.avgResolutionDays} days` : '—'}
            </p>
            <p className="text-xs text-gray-500">Resolved/closed</p>
          </div>
        </div>
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

        {/* Complaints by Priority */}
        <div className="rounded-xl bg-white p-6" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
          <h3 className="mb-4 text-lg font-semibold text-[#081636]">
            Complaints by Priority
          </h3>
          {stats.complaintsByPriority.length > 0 ? (
            <div className="flex items-center justify-center gap-6">
              <DonutChart
                data={stats.complaintsByPriority.map((p, i) => ({
                  label: p.priority === 'unset' ? 'Unset' : p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
                  value: p.count,
                  color: ['#ef4444', '#f59e0b', '#10b981', '#6b7280'][i % 4],
                }))}
                centerLabel="Total"
                size={160}
              />
              <div className="space-y-2">
                {stats.complaintsByPriority.map((p) => (
                  <div key={p.priority} className="flex items-center gap-2">
                    <span className="text-sm text-[#081636]">
                      {p.priority === 'unset' ? 'Unset' : p.priority.charAt(0).toUpperCase() + p.priority.slice(1)}:
                    </span>
                    <span className="text-sm font-medium text-[#081636]">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">No priority data</p>
          )}
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

      {/* Complaints Timelines: Opened vs Resolved */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
          <h3 className="mb-4 text-lg font-semibold text-[#081636]">
            Complaints opened (Last 30 Days)
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
        <div className="rounded-xl bg-white p-6" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
          <h3 className="mb-4 text-lg font-semibold text-[#081636]">
            Complaints resolved (Last 30 Days)
          </h3>
          <BarChart
            data={stats.complaintsTimelineResolved.map((item) => ({
              label: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              value: item.count,
              color: '#10b981',
            }))}
            height={150}
            showLabels={false}
          />
          <div className="mt-2 flex justify-between text-xs text-[#081636]">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* Complaints by Type (template) & by Product */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
          <h3 className="mb-4 text-lg font-semibold text-[#081636]">
            Complaints by type
          </h3>
          {stats.complaintsByTemplate.length > 0 ? (
            <HorizontalBarChart
              data={stats.complaintsByTemplate.slice(0, 10).map((t) => ({
                label: t.template_name,
                value: t.count,
              }))}
            />
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">No complaint types yet</p>
          )}
        </div>
        <div className="rounded-xl bg-white p-6" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
          <h3 className="mb-4 text-lg font-semibold text-[#081636]">
            Complaints by product
          </h3>
          {stats.complaintsByProduct.length > 0 ? (
            <HorizontalBarChart
              data={stats.complaintsByProduct.slice(0, 10).map((p) => ({
                label: p.product_name,
                value: p.count,
              }))}
            />
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">No product data yet</p>
          )}
        </div>
      </div>

      {/* Complaints by Facility & Aging of open complaints */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
          <h3 className="mb-4 text-lg font-semibold text-[#081636]">
            Complaints by facility
          </h3>
          {stats.complaintsByFacility.length > 0 ? (
            <HorizontalBarChart
              data={stats.complaintsByFacility.slice(0, 10).map((f) => ({
                label: f.facility_name,
                value: f.count,
              }))}
            />
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">No facility data yet</p>
          )}
        </div>
        <div className="rounded-xl bg-white p-6" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
          <h3 className="mb-4 text-lg font-semibold text-[#081636]">
            Aging of open complaints
          </h3>
          {stats.complaintsAging.some((a) => a.count > 0) ? (
            <HorizontalBarChart
              data={stats.complaintsAging.map((a) => ({
                label: a.label,
                value: a.count,
                color: a.bucket === '30+' ? '#ef4444' : a.bucket === '14-30' ? '#f59e0b' : '#3b82f6',
              }))}
            />
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">No open complaints</p>
          )}
        </div>
      </div>

      {/* Resolution time distribution */}
      <div className="rounded-xl bg-white p-6" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
        <h3 className="mb-4 text-lg font-semibold text-[#081636]">
          Resolution time distribution
        </h3>
        {stats.resolutionTimeBuckets.some((b) => b.count > 0) ? (
          <HorizontalBarChart
            data={stats.resolutionTimeBuckets.map((b) => ({
              label: b.label,
              value: b.count,
            }))}
          />
        ) : (
          <p className="py-8 text-center text-sm text-gray-500">No resolved complaints yet</p>
        )}
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
