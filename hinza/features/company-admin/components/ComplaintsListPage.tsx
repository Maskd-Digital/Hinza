'use client'

import { useState, useEffect, useMemo } from 'react'

interface Complaint {
  id: string
  title: string
  description: string | null
  status: string
  priority: string | null
  created_at: string
  updated_at: string | null
  assigned_to: string | null
  product_id: string | null
  template_id: string | null
}

interface ComplaintsListPageProps {
  companyId: string
  canCreateComplaints: boolean
}

export default function ComplaintsListPage({
  companyId,
  canCreateComplaints,
}: ComplaintsListPageProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  useEffect(() => {
    fetchComplaints()
  }, [companyId])

  const fetchComplaints = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/complaints?company_id=${companyId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch complaints')
      }
      const data = await response.json()
      setComplaints(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load complaints')
    } finally {
      setLoading(false)
    }
  }

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const matchesSearch =
        searchQuery === '' ||
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' ||
        c.status?.toLowerCase() === statusFilter.toLowerCase()

      const matchesPriority =
        priorityFilter === 'all' ||
        c.priority?.toLowerCase() === priorityFilter.toLowerCase()

      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [complaints, searchQuery, statusFilter, priorityFilter])

  const stats = useMemo(() => {
    const byStatus = {
      pending: complaints.filter((c) => c.status?.toLowerCase() === 'pending').length,
      in_progress: complaints.filter((c) => c.status?.toLowerCase() === 'in_progress').length,
      resolved: complaints.filter((c) => c.status?.toLowerCase() === 'resolved').length,
      closed: complaints.filter((c) => c.status?.toLowerCase() === 'closed').length,
    }
    return {
      total: complaints.length,
      byStatus,
    }
  }, [complaints])

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
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

  const getPriorityColor = (priority: string | null) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-700'
      case 'medium':
        return 'bg-orange-100 text-orange-700'
      case 'low':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatStatus = (status: string) => {
    return status
      ?.replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Complaints</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage customer complaints
          </p>
        </div>
        {canCreateComplaints && (
          <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Complaint
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm font-medium text-gray-500">Total</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm font-medium text-yellow-700">Pending</p>
          <p className="mt-1 text-2xl font-semibold text-yellow-800">{stats.byStatus.pending}</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-700">In Progress</p>
          <p className="mt-1 text-2xl font-semibold text-blue-800">{stats.byStatus.in_progress}</p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-700">Resolved</p>
          <p className="mt-1 text-2xl font-semibold text-green-800">{stats.byStatus.resolved}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-700">Closed</p>
          <p className="mt-1 text-2xl font-semibold text-gray-800">{stats.byStatus.closed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search complaints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-lg border border-gray-200 bg-white">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <svg
              className="h-12 w-12 text-gray-400"
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
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'No complaints match your filters'
                : 'No complaints yet'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'All complaints will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Complaint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredComplaints.map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
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
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {complaint.title}
                          </p>
                          {complaint.description && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {complaint.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                          complaint.status
                        )}`}
                      >
                        {formatStatus(complaint.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {complaint.priority ? (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getPriorityColor(
                            complaint.priority
                          )}`}
                        >
                          {complaint.priority.charAt(0).toUpperCase() +
                            complaint.priority.slice(1)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatDate(complaint.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-500">
        Showing {filteredComplaints.length} of {complaints.length} complaints
      </div>
    </div>
  )
}
