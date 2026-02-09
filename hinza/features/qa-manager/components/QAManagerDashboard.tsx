'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface QAManagerDashboardProps {
  companyId: string
  companyName: string
}

interface ComplaintStats {
  total: number
  pending: number
  in_progress: number
  resolved: number
  closed: number
}

interface ComplaintSummary {
  id: string
  title: string
  status: string
  priority: string | null
  created_at: string
}

export default function QAManagerDashboard({
  companyId,
  companyName,
}: QAManagerDashboardProps) {
  const [stats, setStats] = useState<ComplaintStats>({
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  })
  const [recent, setRecent] = useState<ComplaintSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/complaints?company_id=${companyId}`)
      .then((res) => res.json())
      .then((data: ComplaintSummary[]) => {
        const list = Array.isArray(data) ? data : []
        setRecent(list.slice(0, 5))
        setStats({
          total: list.length,
          pending: list.filter((c) => c.status?.toLowerCase() === 'pending').length,
          in_progress: list.filter((c) => c.status?.toLowerCase() === 'in_progress').length,
          resolved: list.filter((c) => c.status?.toLowerCase() === 'resolved').length,
          closed: list.filter((c) => c.status?.toLowerCase() === 'closed').length,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [companyId])

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

  const getStatusColor = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'in_progress':
        return 'bg-blue-100 text-blue-700'
      case 'resolved':
        return 'bg-green-100 text-green-700'
      case 'closed':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">QA Manager Dashboard</h1>
        <p className="text-sm text-gray-500">
          Complaints overview for {companyName}
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-sm font-medium text-yellow-700">Pending</p>
              <p className="mt-1 text-2xl font-semibold text-yellow-800">{stats.pending}</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-700">In Progress</p>
              <p className="mt-1 text-2xl font-semibold text-blue-800">{stats.in_progress}</p>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-medium text-green-700">Resolved</p>
              <p className="mt-1 text-2xl font-semibold text-green-800">{stats.resolved}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-700">Closed</p>
              <p className="mt-1 text-2xl font-semibold text-gray-800">{stats.closed}</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Complaints</h2>
              <Link
                href={`/qa-manager/${companyId}/complaints`}
                className="text-sm font-medium text-amber-600 hover:text-amber-700"
              >
                View all →
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                No complaints yet.
              </p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {recent.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{c.title}</p>
                      <p className="text-xs text-gray-500">{formatDate(c.created_at)}</p>
                    </div>
                    <span
                      className={`ml-4 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                        c.status
                      )}`}
                    >
                      {c.status?.replace(/_/g, ' ')}
                    </span>
                    <Link
                      href={`/qa-manager/${companyId}/complaints?highlight=${c.id}`}
                      className="ml-4 text-sm font-medium text-amber-600 hover:text-amber-700"
                    >
                      Open
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
