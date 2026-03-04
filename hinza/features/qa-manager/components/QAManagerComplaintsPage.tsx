'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Complaint } from '@/types/complaint'
import { Permission } from '@/types/auth'
import { hasPermission } from '@/lib/auth/permissions'
import { formatFacilityName } from '@/lib/utils'

interface QAManagerComplaintsPageProps {
  companyId: string
  companyName: string
  userPermissions: Permission[]
}

interface CompanyUser {
  id: string
  full_name: string | null
  email: string | null
  roles: Array<{ id: string; name: string }>
}

export default function QAManagerComplaintsPage({
  companyId,
  companyName,
  userPermissions,
}: QAManagerComplaintsPageProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [users, setUsers] = useState<CompanyUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [assigning, setAssigning] = useState(false)

  const canAssign = hasPermission(userPermissions, 'complaints:assign') || hasPermission(userPermissions, 'complaints:resolve')

  useEffect(() => {
    fetchComplaints()
    fetchUsers()
  }, [companyId])

  const fetchComplaints = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/complaints?company_id=${companyId}`)
      if (!res.ok) throw new Error('Failed to fetch complaints')
      const data = await res.json()
      setComplaints(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load complaints')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/users?company_id=${companyId}`)
      if (!res.ok) return
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch {
      // ignore
    }
  }

  const qaExecutives = useMemo(() => {
    return users.filter((u) =>
      u.roles?.some((r) => r.name?.toLowerCase().includes('qa'))
    )
  }, [users])

  const handleAssign = async (complaintId: string, assignedTo: string) => {
    setAssigning(true)
    try {
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigned_to_id: assignedTo || null,
          ...(assignedTo ? { status: 'assigned' } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to assign')
      }
      await fetchComplaints()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to assign')
    } finally {
      setAssigning(false)
    }
  }

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const matchSearch =
        !searchQuery ||
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchStatus =
        statusFilter === 'all' ||
        c.status?.toLowerCase() === statusFilter.toLowerCase()
      return matchSearch && matchStatus
    })
  }, [complaints, searchQuery, statusFilter])

  const stats = useMemo(() => {
    return {
      total: complaints.length,
      pending: complaints.filter((c) => c.status?.toLowerCase() === 'pending').length,
      in_progress: complaints.filter((c) => c.status?.toLowerCase() === 'in_progress').length,
      resolved: complaints.filter((c) => c.status?.toLowerCase() === 'resolved').length,
      closed: complaints.filter((c) => c.status?.toLowerCase() === 'closed').length,
    }
  }, [complaints])

  const getStatusColor = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'in_progress':
        return 'bg-blue-100 text-blue-700'
      case 'resolved':
        return 'bg-green-100 text-green-700'
      case 'closed':
        return 'bg-gray-100 text-[#081636]'
      default:
        return 'bg-gray-100 text-[#081636]'
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

  const getAssigneeName = (assignedToId: string | null) => {
    if (!assignedToId) return null
    const u = users.find((x) => x.id === assignedToId)
    return u?.full_name || u?.email || assignedToId
  }

  return (
    <div className="min-h-full bg-[#EFF4FF] p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#081636]">Complaints</h1>
        <p className="text-sm text-[#081636]">
          View, delegate, verify documents, and mark as done
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-lg bg-[#FFFFFF] p-4 shadow-[0_4px_6px_-1px_rgba(37,99,235,0.25),0_2px_4px_-2px_rgba(37,99,235,0.25)]">
          <p className="text-sm font-medium text-[#081636]">Total</p>
          <p className="mt-1 text-2xl font-semibold text-[#081636]">{stats.total}</p>
        </div>
        <div className="rounded-lg bg-[#FFFFFF] p-4 shadow-[0_4px_6px_-1px_rgba(37,99,235,0.25),0_2px_4px_-2px_rgba(37,99,235,0.25)]">
          <p className="text-sm font-medium text-[#FF4242]">Pending</p>
          <p className="mt-1 text-2xl font-semibold text-[#FF4242]">{stats.pending}</p>
        </div>
        <div className="rounded-lg bg-[#FFFFFF] p-4 shadow-[0_4px_6px_-1px_rgba(37,99,235,0.25),0_2px_4px_-2px_rgba(37,99,235,0.25)]">
          <p className="text-sm font-medium text-[#FF9742]">In Progress</p>
          <p className="mt-1 text-2xl font-semibold text-[#FF9742]">{stats.in_progress}</p>
        </div>
        <div className="rounded-lg bg-[#FFFFFF] p-4 shadow-[0_4px_6px_-1px_rgba(37,99,235,0.25),0_2px_4px_-2px_rgba(37,99,235,0.25)]">
          <p className="text-sm font-medium text-[#0FB200]">Resolved</p>
          <p className="mt-1 text-2xl font-semibold text-[#0FB200]">{stats.resolved}</p>
        </div>
        <div className="rounded-lg bg-[#FFFFFF] p-4 shadow-[0_4px_6px_-1px_rgba(37,99,235,0.25),0_2px_4px_-2px_rgba(37,99,235,0.25)]">
          <p className="text-sm font-medium text-[#081636]">Closed</p>
          <p className="mt-1 text-2xl font-semibold text-[#081636]">{stats.closed}</p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 rounded-lg bg-[#FFFFFF] p-4 shadow-[0_4px_6px_-1px_rgba(37,99,235,0.25),0_2px_4px_-2px_rgba(37,99,235,0.25)] sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search complaints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm text-[#081636] shadow-[inset_0_4px_6px_-1px_rgba(1,8,184,0.25)] placeholder:text-[#081636] focus:border-[#0108B8] focus:outline-none focus:ring-1 focus:ring-[#0108B8]"
          />
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#081636]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-[#081636] shadow-[inset_0_4px_6px_-1px_rgba(1,8,184,0.25)] focus:border-[#0108B8] focus:outline-none focus:ring-1 focus:ring-[#0108B8]"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="rounded-lg bg-[#FFFFFF] py-12 text-center shadow-[0_4px_6px_-1px_rgba(37,99,235,0.25),0_2px_4px_-2px_rgba(37,99,235,0.25)]">
          <p className="text-[#081636]">No complaints match your filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-[#FFFFFF] shadow-[0_4px_6px_-1px_rgba(37,99,235,0.25),0_2px_4px_-2px_rgba(37,99,235,0.25)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#081636]">
                    Complaint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#081636]">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#081636]">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#081636]">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#081636]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredComplaints.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-[#081636] truncate max-w-xs">
                          {c.template?.name ?? c.complaint_master_templates?.name ?? c.title}
                        </p>
                        {c.description && (
                          <p className="text-sm text-[#081636] truncate max-w-xs">
                            {c.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                          c.status
                        )}`}
                      >
                        {c.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-[#081636]">
                      {getAssigneeName(c.assigned_to_id) ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-[#081636]">
                      {formatDate(c.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Link
                        href={`/qa-manager/${companyId}/complaints/${c.id}`}
                        className="text-sm font-medium text-[#0108B8] hover:text-[#0108B8]/90"
                      >
                        View / Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
