'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Permission } from '@/types/auth'
import { hasPermission } from '@/lib/auth/permissions'

interface DeptRow {
  id: string
  name: string
}

interface UserRow {
  id: string
  full_name: string | null
  email: string | null
  roles?: Array<{ id: string; name: string }>
}

interface RoleRow {
  id: string
  name: string
}

interface AssignmentRow {
  user_id: string
  department_id: string
  company_id: string
}

interface DepartmentQaAssignmentsPageProps {
  companyId: string
  companyName: string
  userPermissions: Permission[]
  canAssign?: boolean
}

function isQaDeptUser(roleName: string | undefined): boolean {
  const n = roleName?.toLowerCase() ?? ''
  return n.includes('qa manager') || n.includes('qa executive')
}

function getQaRoleLabel(user: UserRow | undefined): string {
  const roleName = user?.roles?.find((r) => isQaDeptUser(r.name))?.name?.toLowerCase() ?? ''
  if (roleName.includes('qa executive')) return 'Executive'
  if (roleName.includes('qa manager')) return 'Manager'
  return '—'
}

async function loadQaAssignableUsers(companyId: string): Promise<UserRow[]> {
  const rolesRes = await fetch(`/api/roles?company_id=${companyId}`)
  if (!rolesRes.ok) throw new Error('Failed to load roles')

  const rolesData: RoleRow[] = await rolesRes.json()
  const qaRoles = (rolesData || []).filter((role) => {
    const name = role.name.trim().toLowerCase()
    return name === 'qa manager' || name === 'qa executive'
  })

  if (qaRoles.length === 0) return []

  const userResponses = await Promise.all(
    qaRoles.map((role) => fetch(`/api/users?company_id=${companyId}&role_id=${role.id}`))
  )

  if (userResponses.some((res) => !res.ok)) {
    throw new Error('Failed to load QA users')
  }

  const usersByRole = await Promise.all(userResponses.map((res) => res.json()))
  const merged = usersByRole.flat().filter(Boolean) as UserRow[]
  const unique = new Map<string, UserRow>()
  merged.forEach((user) => unique.set(user.id, user))
  return [...unique.values()]
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
  const [users, setUsers] = useState<UserRow[]>([])
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
      const [depRes, users, asgRes] = await Promise.all([
        fetch(`/api/departments?company_id=${companyId}`),
        loadQaAssignableUsers(companyId),
        fetch(`/api/department-qa-assignments?company_id=${companyId}`),
      ])
      if (!depRes.ok || !asgRes.ok) throw new Error('Failed to load data')
      const [dep, asg] = await Promise.all([depRes.json(), asgRes.json()])
      setDepartments(Array.isArray(dep) ? dep : [])
      setUsers(users)
      setAssignments(Array.isArray(asg) ? asg : [])
      if (!departmentId && Array.isArray(dep) && dep[0]?.id) setDepartmentId(dep[0].id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [companyId])

  const deptNameById = useMemo(() => {
    const m = new Map<string, string>()
    departments.forEach((d) => m.set(d.id, d.name))
    return m
  }, [departments])

  const userLabel = (u: UserRow) => u.full_name || u.email || u.id

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

  const userOptions = users

  if (!canAssign) {
    return <p className="text-sm text-gray-600">You do not have permission to manage department QA assignments.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#081636]">Department QA assignments</h1>
        <p className="mt-1 text-sm text-[#081636]">
          {companyName} — assign QA Manager / QA Executive users to departments (queue scope).
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <p className="text-sm font-medium text-[#081636]">New assignment</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-gray-600">User</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black"
              required
            >
              <option value="">Select user</option>
              {userOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {userLabel(u)} ({getQaRoleLabel(u)})
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
          disabled={saving || departments.length === 0}
          className="mt-4 rounded-lg bg-[#0108B8] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Assign'}
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : assignments.length === 0 ? (
        <p className="text-sm text-gray-500">No assignments yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-[#081636]">User</th>
                <th className="px-4 py-3 text-left font-semibold text-[#081636]">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-[#081636]">Department</th>
                <th className="px-4 py-3 text-right font-semibold text-[#081636]"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assignments.map((a) => {
                const u = users.find((x) => x.id === a.user_id)
                return (
                  <tr key={`${a.user_id}-${a.department_id}`}>
                    <td className="px-4 py-3 text-[#081636]">{u ? userLabel(u) : a.user_id}</td>
                    <td className="px-4 py-3 text-gray-700">{getQaRoleLabel(u)}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {deptNameById.get(a.department_id) ?? a.department_id}
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
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
