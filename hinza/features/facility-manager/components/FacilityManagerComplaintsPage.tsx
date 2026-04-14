'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import type { Complaint } from '@/types/complaint'

interface FacilityManagerComplaintsPageProps {
  companyId: string
  companyName: string
}

export default function FacilityManagerComplaintsPage({
  companyId,
  companyName,
}: FacilityManagerComplaintsPageProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'pending_escalation' | 'all'>('pending_escalation')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const qs = new URLSearchParams({ company_id: companyId, facility_manager_scope: '1' })
    if (filter === 'pending_escalation') qs.set('pending_escalation_only', '1')
    setLoading(true)
    setError(null)
    fetch(`/api/complaints?${qs.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch complaints')
        return res.json()
      })
      .then((data: Complaint[]) => setComplaints(Array.isArray(data) ? data : []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [companyId, filter])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return complaints
    return complaints.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    )
  }, [complaints, searchQuery])

  return (
    <div className="p-6" style={{ backgroundColor: '#EFF4FF' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#081636]">Equipment complaints</h1>
        <p className="mt-1 text-sm text-[#081636]">{companyName}</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setFilter('pending_escalation')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            filter === 'pending_escalation'
              ? 'bg-[#0f766e] text-white'
              : 'bg-white text-[#081636] ring-1 ring-gray-200'
          }`}
        >
          Awaiting escalation
        </button>
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            filter === 'all'
              ? 'bg-[#0f766e] text-white'
              : 'bg-white text-[#081636] ring-1 ring-gray-200'
          }`}
        >
          All
        </button>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search…"
          className="min-w-[200px] flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        </div>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-600">No complaints in this view.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-[#081636]">Title</th>
                <th className="px-4 py-3 text-left font-semibold text-[#081636]">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-[#081636]">Escalated</th>
                <th className="px-4 py-3 text-right font-semibold text-[#081636]"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium text-[#081636]">{c.title}</td>
                  <td className="px-4 py-3 text-gray-700">{c.status}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {c.facility_escalated_at
                      ? new Date(c.facility_escalated_at).toLocaleString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/facility-manager/${companyId}/complaints/${c.id}`}
                      className="font-medium text-teal-700 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
