'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface QAExecutiveDashboardProps {
  companyId: string
  companyName: string
  userId: string
}

interface ComplaintSummary {
  id: string
  title: string
  status: string
  priority: string | null
  deadline: string | null
  created_at: string
}

export default function QAExecutiveDashboard({
  companyId,
  companyName,
  userId,
}: QAExecutiveDashboardProps) {
  const [complaints, setComplaints] = useState<ComplaintSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(
      `/api/complaints?company_id=${companyId}&assigned_to_id=${userId}`
    )
      .then((res) => res.json())
      .then((data) => setComplaints(Array.isArray(data) ? data : []))
      .catch(() => setComplaints([]))
      .finally(() => setLoading(false))
  }, [companyId, userId])

  const byStatus = {
    open: complaints.filter((c) => /open|pending|in_progress/i.test(c.status || '')).length,
    resolved: complaints.filter((c) => /resolved|closed/i.test(c.status || '')).length,
  }
  const overdue = complaints.filter((c) => {
    if (!c.deadline) return false
    return new Date(c.deadline) < new Date() && !/resolved|closed/i.test(c.status || '')
  }).length

  const formatDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '—'

  const getStatusColor = (s: string) => {
    if (!s) return 'bg-gray-100 text-gray-700'
    const lower = s.toLowerCase()
    if (lower.includes('open') || lower.includes('pending')) return 'bg-yellow-100 text-yellow-700'
    if (lower.includes('progress')) return 'bg-blue-100 text-blue-700'
    if (lower.includes('resolved') || lower.includes('closed')) return 'bg-green-100 text-green-700'
    return 'bg-gray-100 text-gray-700'
  }

  const recent = complaints.slice(0, 5)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">QA Executive Dashboard</h1>
        <p className="text-sm text-gray-500">
          Complaints assigned to you — {companyName}
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm font-medium text-gray-500">Assigned to me</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{complaints.length}</p>
            </div>
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-sm font-medium text-yellow-700">Open / In progress</p>
              <p className="mt-1 text-2xl font-semibold text-yellow-800">{byStatus.open}</p>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-medium text-green-700">Resolved</p>
              <p className="mt-1 text-2xl font-semibold text-green-800">{byStatus.resolved}</p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">Overdue</p>
              <p className="mt-1 text-2xl font-semibold text-red-800">{overdue}</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent assigned complaints</h2>
              <Link
                href={`/qa-executive/${companyId}/complaints`}
                className="text-sm font-medium text-teal-600 hover:text-teal-700"
              >
                View all →
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                No complaints assigned to you yet.
              </p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {recent.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{c.title}</p>
                      <p className="text-xs text-gray-500">
                        Due: {formatDate(c.deadline)} · {c.status}
                      </p>
                    </div>
                    <span
                      className={`ml-4 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                        c.status
                      )}`}
                    >
                      {c.status}
                    </span>
                    <Link
                      href={`/qa-executive/${companyId}/complaints?highlight=${c.id}`}
                      className="ml-4 text-sm font-medium text-teal-600 hover:text-teal-700"
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
