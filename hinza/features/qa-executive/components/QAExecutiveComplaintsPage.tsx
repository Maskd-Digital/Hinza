'use client'

import { useState, useEffect, useMemo } from 'react'
import { Complaint } from '@/types/complaint'
import { Permission } from '@/types/auth'
import { hasPermission } from '@/lib/auth/permissions'

interface QAExecutiveComplaintsPageProps {
  companyId: string
  companyName: string
  userId: string
  userPermissions: Permission[]
}

export default function QAExecutiveComplaintsPage({
  companyId,
  companyName,
  userId,
  userPermissions,
}: QAExecutiveComplaintsPageProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    deadline: '',
    capa_document_url: '',
    sla_document_url: '',
  })

  const canResolve = hasPermission(userPermissions, 'complaints:resolve')

  useEffect(() => {
    fetchComplaints()
  }, [companyId, userId])

  useEffect(() => {
    if (selectedComplaint) {
      setFormData({
        deadline: selectedComplaint.deadline
          ? new Date(selectedComplaint.deadline).toISOString().slice(0, 16)
          : '',
        capa_document_url: selectedComplaint.capa_document_url || '',
        sla_document_url: selectedComplaint.sla_document_url || '',
      })
    }
  }, [selectedComplaint])

  const fetchComplaints = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/complaints?company_id=${companyId}&assigned_to_id=${userId}`
      )
      if (!res.ok) throw new Error('Failed to fetch complaints')
      const data = await res.json()
      setComplaints(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load complaints')
    } finally {
      setLoading(false)
    }
  }

  const updateComplaint = async (
    complaintId: string,
    updates: Record<string, unknown>
  ) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update')
      await fetchComplaints()
      if (selectedComplaint?.id === complaintId) {
        setSelectedComplaint(data as Complaint)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDeadline = () => {
    if (!selectedComplaint) return
    const value = formData.deadline ? new Date(formData.deadline).toISOString() : null
    updateComplaint(selectedComplaint.id, { deadline: value })
  }

  const handleSaveDocuments = () => {
    if (!selectedComplaint) return
    updateComplaint(selectedComplaint.id, {
      capa_document_url: formData.capa_document_url || null,
      sla_document_url: formData.sla_document_url || null,
    })
  }

  const handleResolve = () => {
    if (!selectedComplaint || !canResolve) return
    if (!confirm('Mark this complaint as resolved?')) return
    updateComplaint(selectedComplaint.id, { status: 'resolved' })
    setSelectedComplaint(null)
  }

  const handleSendForVerification = () => {
    if (!selectedComplaint) return
    if (
      !confirm(
        'Send this complaint to QA Manager for verification? They will verify your CAPA/SLA documents.'
      )
    )
      return
    updateComplaint(selectedComplaint.id, {
      submitted_for_verification_at: new Date().toISOString(),
    })
    if (selectedComplaint) {
      setSelectedComplaint({
        ...selectedComplaint,
        submitted_for_verification_at: new Date().toISOString(),
      })
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
        c.status?.toLowerCase().includes(statusFilter.toLowerCase())
      return matchSearch && matchStatus
    })
  }, [complaints, searchQuery, statusFilter])

  const stats = useMemo(() => {
    const open = complaints.filter((c) =>
      /open|pending|in_progress/i.test(c.status || '')
    ).length
    const resolved = complaints.filter((c) =>
      /resolved|closed/i.test(c.status || '')
    ).length
    const overdue = complaints.filter((c) => {
      if (!c.deadline) return false
      return new Date(c.deadline) < new Date() && !/resolved|closed/i.test(c.status || '')
    }).length
    return { total: complaints.length, open, resolved, overdue }
  }, [complaints])

  const getStatusColor = (s: string) => {
    if (!s) return 'bg-gray-100 text-[#081636]'
    const lower = s.toLowerCase()
    if (lower.includes('open') || lower.includes('pending')) return 'bg-yellow-100 text-yellow-700'
    if (lower.includes('progress')) return 'bg-blue-100 text-blue-700'
    if (lower.includes('resolved') || lower.includes('closed')) return 'bg-green-100 text-green-700'
    return 'bg-gray-100 text-[#081636]'
  }

  const formatDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          ...(d.includes('T') ? { hour: '2-digit', minute: '2-digit' } : {}),
        })
      : '—'

  const isOverdue = (c: Complaint) => {
    if (!c.deadline || /resolved|closed/i.test(c.status || '')) return false
    return new Date(c.deadline) < new Date()
  }

  return (
    <div className="min-h-full bg-[#EFF4FF] p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#081636]">My Assigned Complaints</h1>
        <p className="text-sm text-[#081636]">
          Work on complaints assigned to you — deadline, documents, resolve, send for verification
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg bg-[#FFFFFF] p-4 shadow-[0_4px_6px_-1px_rgba(37,99,235,0.25),0_2px_4px_-2px_rgba(37,99,235,0.25)]">
          <p className="text-sm font-medium text-[#081636]">Total</p>
          <p className="mt-1 text-2xl font-semibold text-[#081636]">{stats.total}</p>
        </div>
        <div className="rounded-lg bg-[#FFFFFF] p-4 shadow-[0_4px_6px_-1px_rgba(37,99,235,0.25),0_2px_4px_-2px_rgba(37,99,235,0.25)]">
          <p className="text-sm font-medium text-[#FF9742]">Open</p>
          <p className="mt-1 text-2xl font-semibold text-[#FF9742]">{stats.open}</p>
        </div>
        <div className="rounded-lg bg-[#FFFFFF] p-4 shadow-[0_4px_6px_-1px_rgba(37,99,235,0.25),0_2px_4px_-2px_rgba(37,99,235,0.25)]">
          <p className="text-sm font-medium text-[#0FB200]">Resolved</p>
          <p className="mt-1 text-2xl font-semibold text-[#0FB200]">{stats.resolved}</p>
        </div>
        <div className="rounded-lg bg-[#FFFFFF] p-4 shadow-[0_4px_6px_-1px_rgba(37,99,235,0.25),0_2px_4px_-2px_rgba(37,99,235,0.25)]">
          <p className="text-sm font-medium text-[#FF4242]">Overdue</p>
          <p className="mt-1 text-2xl font-semibold text-[#FF4242]">{stats.overdue}</p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 rounded-lg bg-[#FFFFFF] p-4 shadow-[0_4px_6px_-1px_rgba(37,99,235,0.25),0_2px_4px_-2px_rgba(37,99,235,0.25)] sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search my complaints..."
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
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="rounded-lg bg-[#FFFFFF] py-12 text-center shadow-[0_4px_6px_-1px_rgba(37,99,235,0.25),0_2px_4px_-2px_rgba(37,99,235,0.25)]">
          <p className="text-[#081636]">No complaints assigned to you match your filters.</p>
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
                    Deadline
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
                        {c.status}
                      </span>
                      {c.submitted_for_verification_at && (
                        <span className="ml-1 text-xs text-[#0108B8]">Sent for verification</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className={isOverdue(c) ? 'text-red-600 font-medium' : 'text-[#081636]'}>
                        {formatDate(c.deadline ?? null)}
                      </span>
                      {isOverdue(c) && (
                        <span className="ml-1 text-xs text-red-600">Overdue</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedComplaint(c)}
                        className="text-sm font-medium text-[#0108B8] hover:text-[#0108B8]/90"
                      >
                        Details & actions
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <h2 className="text-lg font-semibold text-[#081636] truncate pr-4">
                {selectedComplaint.title}
              </h2>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="flex-shrink-0 rounded-lg p-1 text-[#081636] hover:bg-gray-100 hover:text-[#081636]"
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
                  <p className="mt-1 text-sm text-[#081636]">{selectedComplaint.description}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-4 text-sm">
                <span>
                  <strong className="text-[#081636]">Status:</strong>{' '}
                  <span className={getStatusColor(selectedComplaint.status)}>
                    {selectedComplaint.status}
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
                {selectedComplaint.submitted_for_verification_at && (
                  <span className="text-[#0108B8]">
                    Sent for verification {formatDate(selectedComplaint.submitted_for_verification_at)}
                  </span>
                )}
              </div>

              {/* Deadline */}
              <div>
                <h3 className="mb-2 text-sm font-medium text-[#081636]">Deadline</h3>
                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, deadline: e.target.value }))
                    }
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-[#081636] focus:border-[#0108B8] focus:outline-none focus:ring-1 focus:ring-[#0108B8]"
                  />
                  <button
                    onClick={handleSaveDeadline}
                    disabled={saving}
                    className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save deadline'}
                  </button>
                </div>
              </div>

              {/* Attach documents (CAPA / SLA URLs) */}
              <div>
                <h3 className="mb-2 text-sm font-medium text-[#081636]">Attach documents</h3>
                <p className="mb-2 text-xs text-[#081636]">
                  Add links to CAPA and SLA documents (e.g. from your storage or shared drive).
                </p>
                <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div>
                    <label className="block text-xs font-medium text-[#081636]">CAPA document URL</label>
                    <input
                      type="url"
                      value={formData.capa_document_url}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, capa_document_url: e.target.value }))
                      }
                      placeholder="https://..."
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-[#081636] focus:border-[#0108B8] focus:outline-none focus:ring-1 focus:ring-[#0108B8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#081636]">SLA document URL</label>
                    <input
                      type="url"
                      value={formData.sla_document_url}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, sla_document_url: e.target.value }))
                      }
                      placeholder="https://..."
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-[#081636] focus:border-[#0108B8] focus:outline-none focus:ring-1 focus:ring-[#0108B8]"
                    />
                  </div>
                  <button
                    onClick={handleSaveDocuments}
                    disabled={saving}
                    className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save document links'}
                  </button>
                </div>
              </div>

              {/* Send for verification */}
              {!/resolved|closed/i.test(selectedComplaint.status || '') && (
                <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-4">
                  <button
                    onClick={handleSendForVerification}
                    disabled={saving}
                    className="rounded-lg border border-teal-600 bg-white px-4 py-2 text-sm font-medium text-teal-600 hover:bg-teal-50 disabled:opacity-50"
                  >
                    Send for verification (to QA Manager)
                  </button>
                  {canResolve && (
                    <button
                      onClick={handleResolve}
                      disabled={saving}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Resolve complaint
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
