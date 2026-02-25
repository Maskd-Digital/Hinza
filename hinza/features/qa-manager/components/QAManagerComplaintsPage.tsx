'use client'

import { useState, useEffect, useMemo } from 'react'
import { Complaint } from '@/types/complaint'
import { Permission } from '@/types/auth'
import { hasPermission } from '@/lib/auth/permissions'

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
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [markingDone, setMarkingDone] = useState(false)

  const canAssign = hasPermission(userPermissions, 'complaints:assign') || hasPermission(userPermissions, 'complaints:resolve')
  const canResolve = hasPermission(userPermissions, 'complaints:resolve')

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
      if (selectedComplaint?.id === complaintId) {
        setSelectedComplaint(data as Complaint)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to assign')
    } finally {
      setAssigning(false)
    }
  }

  const handleVerifyDocument = async (
    complaintId: string,
    doc: 'capa' | 'sla'
  ) => {
    setVerifying(`${complaintId}-${doc}`)
    try {
      const body: Record<string, string | null> = {}
      const now = new Date().toISOString()
      if (doc === 'capa') {
        body.capa_verified_at = now
      } else {
        body.sla_verified_at = now
      }
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to verify')
      await fetchComplaints()
      const updated = await res.json()
      if (selectedComplaint?.id === complaintId) setSelectedComplaint(updated)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to verify')
    } finally {
      setVerifying(null)
    }
  }

  const handleMarkDone = async (complaintId: string) => {
    setMarkingDone(true)
    try {
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to close')
      }
      await fetchComplaints()
      setSelectedComplaint(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to mark as done')
    } finally {
      setMarkingDone(false)
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
                      <div>
                        <p className="text-sm font-medium text-[#081636] truncate max-w-xs">
                          {c.title}
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
                      <button
                        onClick={() => setSelectedComplaint(c)}
                        className="text-sm font-medium text-[#0108B8] hover:text-[#0108B8]/90"
                      >
                        View / Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Complaint detail modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <h2 className="text-lg font-semibold text-[#081636]">
                {selectedComplaint.title}
              </h2>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="rounded-lg p-1 text-[#081636] hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-6 p-6">
              {selectedComplaint.description && (
                <div>
                  <h3 className="text-sm font-medium text-[#081636]">Description</h3>
                  <p className="mt-1 text-sm text-gray-600">{selectedComplaint.description}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-4 text-sm">
                <span>
                  <strong className="text-[#081636]">Status:</strong>{' '}
                  <span className={getStatusColor(selectedComplaint.status)}>
                    {selectedComplaint.status?.replace(/_/g, ' ')}
                  </span>
                </span>
                <span>
                  <strong className="text-[#081636]">Priority:</strong>{' '}
                  {selectedComplaint.priority ?? '—'}
                </span>
                <span>
                  <strong className="text-[#081636]">Created:</strong>{' '}
                  {formatDate(selectedComplaint.created_at)}
                </span>
              </div>

              {/* Assign / Reassign to QA Executive - always show for QA Manager (page is role-gated) */}
              {selectedComplaint.status?.toLowerCase() !== 'closed' && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <h3 className="mb-2 text-sm font-medium text-[#081636]">
                    {selectedComplaint.assigned_to_id ? 'Reassign' : 'Assign'} to QA Executive
                  </h3>
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedComplaint.assigned_to_id ?? ''}
                      onChange={(e) =>
                        handleAssign(selectedComplaint.id, e.target.value)
                      }
                      disabled={assigning}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-[#081636] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
                    >
                      <option value="">Unassigned</option>
                      {qaExecutives.length > 0 ? (
                        qaExecutives.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.full_name || u.email || u.id}
                          </option>
                        ))
                      ) : (
                        users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.full_name || u.email || u.id}
                            {u.roles?.length > 0 && ` (${u.roles.map((r) => r.name).join(', ')})`}
                          </option>
                        ))
                      )}
                    </select>
                    {assigning && (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                    )}
                  </div>
                </div>
              )}

              <div>
                <h3 className="mb-2 text-sm font-medium text-[#081636]">
                  Documents (CAPA / SLA)
                </h3>
                <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#081636]">CAPA</p>
                      {selectedComplaint.capa_document_url ? (
                        <a
                          href={selectedComplaint.capa_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#0108B8] hover:underline"
                        >
                          View document
                        </a>
                      ) : (
                        <p className="text-sm text-[#081636]">No document linked</p>
                      )}
                    </div>
                    {selectedComplaint.capa_document_url && (
                      <div>
                        {selectedComplaint.capa_verified_at ? (
                          <span className="text-sm text-green-600">Verified</span>
                        ) : (
                          <button
                            onClick={() =>
                              handleVerifyDocument(selectedComplaint.id, 'capa')
                            }
                            disabled={verifying === `${selectedComplaint.id}-capa`}
                            className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                          >
                            {verifying === `${selectedComplaint.id}-capa`
                              ? 'Verifying...'
                              : 'Verify'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#081636]">SLA</p>
                      {selectedComplaint.sla_document_url ? (
                        <a
                          href={selectedComplaint.sla_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#0108B8] hover:underline"
                        >
                          View document
                        </a>
                      ) : (
                        <p className="text-sm text-[#081636]">No document linked</p>
                      )}
                    </div>
                    {selectedComplaint.sla_document_url && (
                      <div>
                        {selectedComplaint.sla_verified_at ? (
                          <span className="text-sm text-green-600">Verified</span>
                        ) : (
                          <button
                            onClick={() =>
                              handleVerifyDocument(selectedComplaint.id, 'sla')
                            }
                            disabled={verifying === `${selectedComplaint.id}-sla`}
                            className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                          >
                            {verifying === `${selectedComplaint.id}-sla`
                              ? 'Verifying...'
                              : 'Verify'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {canResolve && selectedComplaint.status?.toLowerCase() !== 'closed' && (
                <div className="border-t border-gray-200 pt-4">
                  <button
                    onClick={() => handleMarkDone(selectedComplaint.id)}
                    disabled={markingDone}
                    className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {markingDone ? 'Updating...' : 'Mark as done (close complaint)'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
