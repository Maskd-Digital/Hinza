'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface QAManagerDashboardProps {
  companyId: string
  companyName: string
  isOperationsManager?: boolean
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
  departments?: { id: string; name: string; code?: string | null } | null
}

interface AssignedDepartment {
  id: string
  name: string
  code: string | null
}

export default function QAManagerDashboard({
  companyId,
  companyName,
  isOperationsManager = false,
}: QAManagerDashboardProps) {
  const [stats, setStats] = useState<ComplaintStats>({
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  })
  const [recent, setRecent] = useState<ComplaintSummary[]>([])
  const [assignedDepartments, setAssignedDepartments] = useState<AssignedDepartment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [complaintsRes, deptsRes] = await Promise.all([
          fetch(`/api/complaints?company_id=${companyId}&qa_workspace=1`),
          !isOperationsManager
            ? fetch(
                `/api/department-qa-assignments?company_id=${companyId}&mine=1`
              )
            : Promise.resolve(null),
        ])

        const data = await complaintsRes.json()
        const list: ComplaintSummary[] = Array.isArray(data) ? data : []
        setRecent(list.slice(0, 5))
        setStats({
          total: list.length,
          pending: list.filter((c) => c.status?.toLowerCase() === 'pending').length,
          in_progress: list.filter((c) => c.status?.toLowerCase() === 'in_progress').length,
          resolved: list.filter((c) => c.status?.toLowerCase() === 'resolved').length,
          closed: list.filter((c) => c.status?.toLowerCase() === 'closed').length,
        })

        if (deptsRes?.ok) {
          const deptPayload = await deptsRes.json()
          setAssignedDepartments(
            Array.isArray(deptPayload?.departments) ? deptPayload.departments : []
          )
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [companyId, isOperationsManager])

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
        return 'bg-gray-100 text-[#081636]'
      default:
        return 'bg-gray-100 text-[#081636]'
    }
  }

  return (
    <div className="min-h-full bg-[#EFF4FF] p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#081636]">
          {isOperationsManager ? 'Operations Manager Dashboard' : 'QA Manager Dashboard'}
        </h1>
        <p className="text-sm text-[#081636]">
          {isOperationsManager
            ? `Company-wide oversight and department QA staffing for ${companyName}`
            : `Complaints overview for ${companyName}`}
        </p>
      </div>

      {!isOperationsManager && !loading && (
        <div className="mb-6 rounded-lg bg-white p-4 shadow-[0_4px_6px_-1px_rgba(37,99,235,0.25),0_2px_4px_-2px_rgba(37,99,235,0.25)]">
          <p className="text-sm font-semibold text-[#081636]">Your assigned departments</p>
          {assignedDepartments.length === 0 ? (
            <p className="mt-2 text-sm text-[#081636]">
              No departments assigned yet. Ask an Operations Manager to assign you to a
              department (e.g. Sales) to see related complaints.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {assignedDepartments.map((d) => (
                <span
                  key={d.id}
                  className="inline-flex items-center rounded-md bg-[#EFF4FF] px-3 py-1.5 text-sm font-medium text-[#0108B8]"
                >
                  {d.name}
                  {d.code ? (
                    <span className="ml-1.5 text-xs text-[#081636]/70">({d.code})</span>
                  ) : null}
                </span>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-[#081636]/80">
            View Complaints shows only complaints for these departments.
          </p>
        </div>
      )}

      {isOperationsManager && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href={`/qa-manager/${companyId}/department-qa`}
            className="rounded-lg bg-white p-5 shadow-[0_4px_6px_-1px_rgba(37,99,235,0.25),0_2px_4px_-2px_rgba(37,99,235,0.25)] transition hover:opacity-90"
          >
            <p className="text-sm font-semibold text-[#081636]">Department QA assignments</p>
            <p className="mt-1 text-sm text-[#081636]">
              Assign QA Managers and QA Executives to departments.
            </p>
          </Link>
          <Link
            href={`/qa-manager/${companyId}/complaints`}
            className="rounded-lg bg-white p-5 shadow-[0_4px_6px_-1px_rgba(37,99,235,0.25),0_2px_4px_-2px_rgba(37,99,235,0.25)] transition hover:opacity-90"
          >
            <p className="text-sm font-semibold text-[#081636]">View all complaints</p>
            <p className="mt-1 text-sm text-[#081636]">
              Company-wide complaint queue and status overview.
            </p>
          </Link>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
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

          <div className="rounded-lg bg-[#FFFFFF] p-6 shadow-[0_4px_6px_-1px_rgba(37,99,235,0.25),0_2px_4px_-2px_rgba(37,99,235,0.25)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#081636]">Recent Complaints</h2>
              <Link
                href={`/qa-manager/${companyId}/complaints`}
                className="text-sm font-medium text-[#0108B8] hover:text-[#0108B8]/90"
              >
                View all →
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#081636]">
                {!isOperationsManager && assignedDepartments.length === 0
                  ? 'No department assignments — no complaints to show.'
                  : 'No complaints in your assigned departments yet.'}
              </p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {recent.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#081636]">{c.title}</p>
                      <p className="text-xs text-[#081636]">
                        {c.departments?.name ? `${c.departments.name} · ` : ''}
                        {formatDate(c.created_at)}
                      </p>
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
                      className="ml-4 text-sm font-medium text-[#0108B8] hover:text-[#0108B8]/90"
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
