'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/Modal'

interface ViewComplaintsModalProps {
  isOpen: boolean
  onClose: () => void
  companyId: string
}

interface Complaint {
  id: string
  title?: string
  description?: string
  status?: string
  created_at: string
  updated_at?: string
  [key: string]: any
}

export default function ViewComplaintsModal({
  isOpen,
  onClose,
  companyId,
}: ViewComplaintsModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [complaints, setComplaints] = useState<Complaint[]>([])

  useEffect(() => {
    if (isOpen && companyId) {
      fetchComplaints()
    }
  }, [isOpen, companyId])

  const fetchComplaints = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/complaints?company_id=${companyId}`)
      if (!response.ok) {
        // If complaints API doesn't exist yet, show empty state
        if (response.status === 404) {
          setComplaints([])
          return
        }
        throw new Error('Failed to fetch complaints')
      }
      const data = await response.json()
      setComplaints(Array.isArray(data) ? data : [])
    } catch (err) {
      // If API doesn't exist, just show empty state
      if (err instanceof Error && err.message.includes('404')) {
        setComplaints([])
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load complaints')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Company Complaints" size="xl">
      <div className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-gray-500">
            Loading complaints...
          </div>
        ) : complaints.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No complaints found for this company.
          </div>
        ) : (
          <div className="space-y-3">
            {complaints.map((complaint) => (
              <div
                key={complaint.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {complaint.title && (
                      <h3 className="text-lg font-semibold text-gray-900">
                        {complaint.title}
                      </h3>
                    )}
                    {complaint.description && (
                      <p className="mt-1 text-sm text-gray-600">
                        {complaint.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {complaint.status && (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            complaint.status === 'resolved'
                              ? 'bg-green-100 text-green-800'
                              : complaint.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {complaint.status}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        Created:{' '}
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
