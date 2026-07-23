'use client'

import { useState, useEffect } from 'react'
import type { Permission } from '@/types/auth'
import { hasPermission } from '@/lib/auth/permissions'

interface DeptRow {
  id: string
  name: string
  code?: string | null
}

interface UserOption {
  id: string
  full_name: string | null
  email: string | null
}

interface AssignmentRow {
  user_id: string
  department_id: string
  company_id: string
  created_at?: string
  user_name?: string
  department_name?: string
}

interface DepartmentQaAssignmentsPageProps {
  companyId: string
  companyName: string
  userPermissions: Permission[]
  canAssign?: boolean
}

function userLabel(u: UserOption) {
  return u.full_name || u.email || u.id
}

export default function DepartmentQaAssignmentsPage({
  companyId,
  companyName,
  userPermissions,
  canAssign: canAssignProp,
}: DepartmentQaAssignmentsPageProps) {
  const canAssign =
    canAssignProp ?? hasPermission(userPermissions, 'department_qa:assign')

  const [departments, setDepartments] = useState<DeptRow[]>([])
  const [executives, setExecutives] = useState<UserOption[]>([])
  const [assignments, setAssignments] = useState<AssignmentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/department-qa/options?company_id=${companyId}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to load department QA data')
      }
      const data = await res.json()
      const deptList = Array.isArray(data.departments) ? data.departments : []
      setDepartments(deptList)
      setExecutives(Array.isArray(data.executives) ? data.executives : [])
      setAssignments(Array.isArray(data.assignments) ? data.assignments : [])
      if (!departmentId && deptList[0]?.id) setDepartmentId(deptList[0].id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [companyId])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !departmentId) return
    setSaving(true)
    try {
      const res = await fetch('/api/department-qa-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          department_id: departmentId,
          company_id: companyId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to assign')
      setUserId('')
      await load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (uid: string, did: string) => {
    if (!confirm('Remove this assignment?')) return
    const qs = new URLSearchParams({
      user_id: uid,
      department_id: did,
      company_id: companyId,
    })
    const res = await fetch(`/api/department-qa-assignments?${qs}`, { method: 'DELETE' })
    if (!res.ok) {
      const d = await res.json()
      alert(d.error || 'Failed')
      return
    }
    await load()
  }

  if (!canAssign) {
    return (
      <p className="text-sm text-gray-600">
        You do not have permission to manage department QA assignments.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#081636]">Department QA assignments</h1>
        <p className="mt-1 text-sm text-[#081636]">
          {companyName} — assign QA Executives to departments. QA Managers and Operations
          Managers are company-wide and are not assigned to departments.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-[#081636]">
            QA Executives ({executives.length})
          </p>
          {loading ? (
            <p className="mt-2 text-sm text-gray-500">Loading…</p>
          ) : executives.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No QA Executive users found.</p>
          ) : (
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-sm text-[#081636]">
              {executives.map((u) => (
                <li key={u.id}>{userLabel(u)}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-[#081636]">
            Departments ({departments.length})
          </p>
          {loading ? (
            <p className="mt-2 text-sm text-gray-500">Loading…</p>
          ) : departments.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No departments found in database.</p>
          ) : (
            <ul className="mt-2 grid grid-cols-1 gap-1 text-sm text-[#081636] sm:grid-cols-2">
              {departments.map((d) => (
                <li key={d.id}>
                  {d.name}
                  {d.code ? ` (${d.code})` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <form
        onSubmit={handleAdd}
        className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <p className="text-sm font-medium text-[#081636]">Assign executive to department</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-gray-600">QA Executive</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black"
              required
            >
              <option value="">Select executive</option>
              {executives.map((u) => (
                <option key={u.id} value={u.id}>
                  {userLabel(u)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black"
              required
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving || departments.length === 0 || executives.length === 0}
          className="mt-4 rounded-lg bg-[#0108B8] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Assign'}
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">Loading assignments…</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : assignments.length === 0 ? (
        <p className="text-sm text-gray-500">No executive assignments yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-[#081636]">
                  Executive
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[#081636]">
                  Department
                </th>
                <th className="px-4 py-3 text-right font-semibold text-[#081636]"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assignments.map((a) => (
                <tr key={`${a.user_id}-${a.department_id}`}>
                  <td className="px-4 py-3 text-[#081636]">{a.user_name ?? a.user_id}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {a.department_name ?? a.department_id}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemove(a.user_id, a.department_id)}
                      className="text-sm font-medium text-red-600 hover:underline"
                    >
                      Remove
                    </button>
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
