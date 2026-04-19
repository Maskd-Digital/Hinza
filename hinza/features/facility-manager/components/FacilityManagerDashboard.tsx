'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Complaint } from '@/types/complaint'

interface FacilityManagerDashboardProps {
  companyId: string
  companyName: string
  roleLabel?: string
}

export default function FacilityManagerDashboard({
  companyId,
  companyName,
  roleLabel = 'Facility Manager',
}: FacilityManagerDashboardProps) {
  const [pending, setPending] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(
      `/api/complaints?company_id=${companyId}&facility_manager_scope=1&pending_escalation_only=1`
    )
      .then((res) => res.json())
      .then((data: Complaint[]) => {
        setPending(Array.isArray(data) ? data : [])
      })
      .catch(() => setPending([]))
      .finally(() => setLoading(false))
  }, [companyId])

  return (
    <div className="p-6" style={{ backgroundColor: '#EFF4FF' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#081636]">{roleLabel}</h1>
        <p className="mt-1 text-[#081636]">
          {companyName} — review equipment complaints at your facilities before they go to QA.
        </p>
      </div>

      <div
        className="rounded-lg border border-gray-200 p-6"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow: '0 4px 14px 0 rgba(15, 118, 110, 0.2)',
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#081636]">Awaiting escalation</h2>
            <p className="mt-1 text-sm text-gray-600">
              Complaints that need your review before QA Manager can assign them.
            </p>
          </div>
          <span className="rounded-full bg-teal-100 px-3 py-1 text-sm font-semibold text-teal-800">
            {loading ? '…' : pending.length}
          </span>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-gray-500">Loading…</p>
        ) : pending.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No complaints waiting on you.</p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100">
            {pending.slice(0, 5).map((c) => (
              <li key={c.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-[#081636]">{c.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  href={`/facility-manager/${companyId}/complaints/${c.id}`}
                  className="text-sm font-medium text-teal-700 hover:underline"
                >
                  Open
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6">
          <Link
            href={`/facility-manager/${companyId}/complaints`}
            className="inline-flex rounded-lg bg-[#0f766e] px-4 py-2 text-sm font-medium text-white hover:bg-[#0d9488]"
          >
            View all equipment complaints
          </Link>
        </div>
      </div>
    </div>
  )
}
