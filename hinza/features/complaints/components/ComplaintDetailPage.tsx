'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Complaint, ComplaintComment, ComplaintDocument } from '@/types/complaint'
import type { Permission } from '@/types/auth'
import ComplaintAdditionalDetails from '@/components/ComplaintAdditionalDetails'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') ?? ''
const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_COMPLAINTS_BUCKET ?? 'complaints'

function getDocumentUrl(filePath: string): string {
  if (!SUPABASE_URL) return `/api/storage/photo?path=${encodeURIComponent(filePath)}`
  const encoded = filePath.split('/').map(encodeURIComponent).join('/')
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encoded}`
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatFacilityName(facilities: Complaint['facilities']): string {
  if (!facilities) return '—'
  const parts = [
    facilities.address,
    facilities.city,
    facilities.state,
    facilities.country,
    facilities.postal_code,
  ].filter(Boolean)
  return parts.length ? parts.join(', ') : facilities.name ?? '—'
}

export type ComplaintDetailUserRole = 'company_admin' | 'qa_executive' | 'qa_manager'

interface ComplaintDetailPageProps {
  complaintId: string
  companyId: string
  companyName: string
  user: { id: string; full_name: string | null; email: string | null; permissions: Permission[] }
  userRole: ComplaintDetailUserRole
  backHref: string
  backLabel?: string
}

export default function ComplaintDetailPage({
  complaintId,
  companyId,
  companyName,
  user,
  userRole,
  backHref,
  backLabel = 'Back to list',
}: ComplaintDetailPageProps) {
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [comments, setComments] = useState<ComplaintComment[]>([])
  const [documents, setDocuments] = useState<ComplaintDocument[]>([])
  const [users, setUsers] = useState<Array<{ id: string; full_name: string | null; email: string | null }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commentBody, setCommentBody] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState<'capa' | 'sla' | null>(null)
  const [sendingReview, setSendingReview] = useState(false)
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const fileInputCapa = useRef<HTMLInputElement>(null)
  const fileInputSla = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const fetchComplaint = async () => {
    const res = await fetch(`/api/complaints/${complaintId}`)
    if (!res.ok) throw new Error('Failed to fetch complaint')
    const data = await res.json()
    setComplaint(data)
  }

  const fetchComments = async () => {
    const res = await fetch(`/api/complaints/${complaintId}/comments`)
    if (!res.ok) return
    const data = await res.json()
    setComments(Array.isArray(data) ? data : [])
  }

  const fetchDocuments = async () => {
    const res = await fetch(`/api/complaints/${complaintId}/documents`)
    if (!res.ok) return
    const data = await res.json()
    setDocuments(Array.isArray(data) ? data : [])
  }

  const fetchUsers = async () => {
    const res = await fetch(`/api/users?company_id=${companyId}`)
    if (!res.ok) return
    const data = await res.json()
    setUsers(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        await Promise.all([fetchComplaint(), fetchComments(), fetchDocuments(), fetchUsers()])
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [complaintId, companyId])

  const getAssigneeName = (assignedToId: string | null) => {
    if (!assignedToId) return '—'
    const u = users.find((x) => x.id === assignedToId)
    return u?.full_name || u?.email || assignedToId
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = commentBody.trim()
    if (!body) return
    setSubmittingComment(true)
    try {
      const res = await fetch(`/api/complaints/${complaintId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      if (!res.ok) throw new Error('Failed to add comment')
      setCommentBody('')
      await fetchComments()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to add comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleUploadDocument = async (type: 'capa' | 'sla', file: File) => {
    setUploadingDoc(type)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('document_type', type)
      const res = await fetch(`/api/complaints/${complaintId}/documents`, {
        method: 'POST',
        body: form,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Upload failed')
      }
      const data = await res.json()
      if (data.complaint) setComplaint(data.complaint)
      await fetchDocuments()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploadingDoc(null)
    }
  }

  const handleSendForReview = async () => {
    if (!complaint || !confirm('Send this complaint to QA Manager for review?')) return
    setSendingReview(true)
    try {
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submitted_for_verification_at: new Date().toISOString() }),
      })
      if (!res.ok) throw new Error('Failed to send for review')
      await fetchComplaint()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSendingReview(false)
    }
  }

  const handleApprove = async () => {
    if (!complaint || !confirm('Approve and close this complaint?')) return
    setApproving(true)
    try {
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'closed',
          review_status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        }),
      })
      if (!res.ok) throw new Error('Failed to approve')
      await fetchComplaint()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed')
    } finally {
      setApproving(false)
    }
  }

  const handleReject = async () => {
    setRejecting(true)
    try {
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          rejection_reason: rejectReason.trim() || null,
        }),
      })
      if (!res.ok) throw new Error('Failed to reject')
      setShowRejectModal(false)
      setRejectReason('')
      await fetchComplaint()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed')
    } finally {
      setRejecting(false)
    }
  }

  const isExecutive = userRole === 'qa_executive'
  const isQAManager = userRole === 'qa_manager'
  const canSendForReview = isExecutive && complaint && !/resolved|closed/i.test(complaint.status || '') && !complaint.submitted_for_verification_at
  const pendingReview = complaint?.review_status === 'pending_review'
  const canApproveReject = isQAManager && complaint && pendingReview

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (error || !complaint) {
    return (
      <div className="mx-4 my-6 rounded-lg bg-red-50 p-6 md:mx-6 lg:mx-8">
        <p className="text-red-800">{error || 'Complaint not found'}</p>
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="mt-4 rounded-lg bg-[#0108B8] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#0108B8]/90"
        >
          ← {backLabel}
        </button>
      </div>
    )
  }

  const capaDocs = documents.filter((d) => d.document_type === 'capa')
  const slaDocs = documents.filter((d) => d.document_type === 'sla')

  return (
    <div className="mx-4 space-y-6 py-6 md:mx-6 lg:mx-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(backHref)}
            className="rounded-lg bg-[#0108B8] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#0108B8]/90"
          >
            ← {backLabel}
          </button>
          <h1 className="text-2xl font-bold text-[#081636]">{complaint.title}</h1>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-gray-500">Status</p>
            <p className="mt-1 font-medium text-[#081636]">{complaint.status}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-gray-500">Priority</p>
            <p className="mt-1 font-medium text-[#081636]">{complaint.priority ?? '—'}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-gray-500">Assigned to</p>
            <p className="mt-1 font-medium text-[#081636]">{getAssigneeName(complaint.assigned_to_id ?? null)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-gray-500">Deadline</p>
            <p className="mt-1 font-medium text-[#081636]">{formatDate(complaint.deadline ?? null)}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-[#EFF4FF] p-4">
            <p className="text-xs font-semibold uppercase text-gray-600">Complaint type</p>
            <p className="mt-1 text-sm font-medium text-[#081636]">
              {complaint.template?.name ?? complaint.complaint_master_templates?.name ?? '—'}
            </p>
          </div>
          <div className="rounded-lg bg-[#EFF4FF] p-4">
            <p className="text-xs font-semibold uppercase text-gray-600">Product</p>
            <p className="mt-1 text-sm font-medium text-[#081636]">
              {(complaint as { products?: { name?: string } }).products?.name ?? '—'}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-[#EFF4FF] p-4">
          <p className="text-xs font-semibold uppercase text-gray-600">Location</p>
          <p className="mt-1 text-sm font-medium text-[#081636]">{formatFacilityName(complaint.facilities)}</p>
        </div>

        <ComplaintAdditionalDetails
          description={complaint.description}
          customFields={complaint.custom_fields}
        />

        {complaint.review_status === 'rejected' && complaint.rejection_reason && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">Rejection reason</p>
            <p className="mt-1 text-sm text-amber-900">{complaint.rejection_reason}</p>
            {complaint.reviewed_at && (
              <p className="mt-2 text-xs text-amber-700">{formatDate(complaint.reviewed_at)}</p>
            )}
          </div>
        )}

        {complaint.submitted_for_verification_at && (
          <p className="mt-4 text-sm text-[#0108B8]">
            Sent for verification {formatDate(complaint.submitted_for_verification_at)}
          </p>
        )}
      </div>

      {/* Comments */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#081636]">Comments</h2>
        <div className="mt-4 space-y-4">
          {comments.length === 0 ? (
            <p className="text-sm text-gray-500">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{c.user?.full_name || c.user?.email || 'Unknown'}</span>
                  <span>{formatDate(c.created_at)}</span>
                </div>
                <p className="mt-1 text-sm text-[#081636] whitespace-pre-wrap">{c.body}</p>
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleAddComment} className="mt-4 flex gap-2">
          <textarea
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="Add a comment..."
            rows={2}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0108B8] focus:outline-none focus:ring-1 focus:ring-[#0108B8]"
          />
          <button
            type="submit"
            disabled={submittingComment || !commentBody.trim()}
            className="rounded-lg bg-[#0108B8] px-4 py-2 text-sm font-medium text-white hover:bg-[#0108B8]/90 disabled:opacity-50"
          >
            {submittingComment ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>

      {/* Documents: CAPA & SLA */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#081636]">Documents</h2>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="font-medium text-[#081636]">CAPA</h3>
            {complaint.capa_document_url ? (
              <a
                href={complaint.capa_document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-blue-600 hover:underline"
              >
                Current document
              </a>
            ) : (
              <p className="mt-2 text-sm text-gray-500">No document</p>
            )}
            {complaint.capa_verified_at && (
              <p className="mt-1 text-xs text-green-600">Verified {formatDate(complaint.capa_verified_at)}</p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <input
                ref={fileInputCapa}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleUploadDocument('capa', f)
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                disabled={!!uploadingDoc}
                onClick={() => fileInputCapa.current?.click()}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-[#081636] hover:bg-gray-50 disabled:opacity-50"
              >
                {uploadingDoc === 'capa' ? 'Uploading...' : 'Upload new version'}
              </button>
            </div>
            {capaDocs.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-gray-600">
                {capaDocs.map((d) => (
                  <li key={d.id}>
                    <a href={getDocumentUrl(d.file_path)} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {d.file_name || 'Document'} — {formatDate(d.uploaded_at)}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="font-medium text-[#081636]">SLA</h3>
            {complaint.sla_document_url ? (
              <a
                href={complaint.sla_document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-blue-600 hover:underline"
              >
                Current document
              </a>
            ) : (
              <p className="mt-2 text-sm text-gray-500">No document</p>
            )}
            {complaint.sla_verified_at && (
              <p className="mt-1 text-xs text-green-600">Verified {formatDate(complaint.sla_verified_at)}</p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <input
                ref={fileInputSla}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleUploadDocument('sla', f)
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                disabled={!!uploadingDoc}
                onClick={() => fileInputSla.current?.click()}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-[#081636] hover:bg-gray-50 disabled:opacity-50"
              >
                {uploadingDoc === 'sla' ? 'Uploading...' : 'Upload new version'}
              </button>
            </div>
            {slaDocs.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-gray-600">
                {slaDocs.map((d) => (
                  <li key={d.id}>
                    <a href={getDocumentUrl(d.file_path)} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {d.file_name || 'Document'} — {formatDate(d.uploaded_at)}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-6">
        {canSendForReview && (
          <button
            onClick={handleSendForReview}
            disabled={sendingReview}
            className="rounded-lg border border-teal-600 bg-white px-4 py-2 text-sm font-medium text-teal-600 hover:bg-teal-50 disabled:opacity-50"
          >
            {sendingReview ? 'Sending...' : 'Send to review (QA Manager)'}
          </button>
        )}
        {canApproveReject && (
          <>
            <button
              onClick={handleApprove}
              disabled={approving}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {approving ? 'Closing...' : 'Approve and close'}
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={rejecting}
              className="rounded-lg border border-red-600 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Reject
            </button>
          </>
        )}
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#081636]">Reject complaint</h3>
            <p className="mt-2 text-sm text-gray-600">Optionally provide a reason (visible to the executive).</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows={3}
              className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0108B8] focus:outline-none focus:ring-1 focus:ring-[#0108B8]"
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowRejectModal(false); setRejectReason('') }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#081636] hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {rejecting ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
