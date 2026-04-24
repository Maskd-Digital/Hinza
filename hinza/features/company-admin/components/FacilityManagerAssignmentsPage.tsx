'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Permission } from '@/types/auth'

interface FacilityRow {
  id: string
  name: string
}

interface UserRow {
  id: string
  full_name: string | null
  email: string | null
  roles?: Array<{ name: string }>
}

interface RoleRow {
  id: string
  name: string
}

interface AssignmentRow {
  user_id: string
  facility_id: string
  company_id: string
  role_type?: string
}

type AssignmentRoleType = 'facility_manager' | 'qa_executive'

interface FacilityManagerAssignmentsPageProps {
  companyId: string
  companyName: string
  userPermissions: Permission[]
}

export default function FacilityManagerAssignmentsPage({
  companyId,
  companyName,
}: FacilityManagerAssignmentsPageProps) {
  const [facilities, setFacilities] = useState<FacilityRow[]>([])
  const [users, setUsers] = useState<UserRow[]>([])
  const [assignments, setAssignments] = useState<AssignmentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState('')
  const [facilityId, setFacilityId] = useState('')
  const [roleType, setRoleType] = useState<AssignmentRoleType>('facility_manager')
  const [saving, setSaving] = useState(false)

  const roleTypeLabel = (type: string | undefined): string => {
    if (type === 'qa_executive') return 'Executive'
    return 'Manager'
  }

  const loadUsersForRoleType = async (selectedRoleType: AssignmentRoleType): Promise<UserRow[]> => {
    const rolesRes = await fetch(`/api/roles?company_id=${companyId}`)
    if (!rolesRes.ok) throw new Error('Failed to load roles')

    const rolesData: RoleRow[] = await rolesRes.json()
    const targetRoleNames =
      selectedRoleType === 'facility_manager'
        ? ['facility manager', 'facility admin']
        : ['qa executive']

    const matchingRoles = (rolesData || []).filter((role) =>
      targetRoleNames.includes(role.name.trim().toLowerCase())
    )

    if (matchingRoles.length === 0) {
      return []
    }

    const userResponses = await Promise.all(
      matchingRoles.map((role) =>
        fetch(`/api/users?company_id=${companyId}&role_id=${role.id}`)
      )
    )

    if (userResponses.some((res) => !res.ok)) {
      throw new Error('Failed to load assignable users')
    }

    const usersByRole = await Promise.all(userResponses.map((res) => res.json()))
    const merged = usersByRole.flat().filter(Boolean) as UserRow[]
    const unique = new Map<string, UserRow>()
    merged.forEach((user) => unique.set(user.id, user))
    return [...unique.values()]
  }

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [facRes, users, asgRes] = await Promise.all([
        fetch(`/api/facilities?company_id=${companyId}`),
        loadUsersForRoleType(roleType),
        fetch(`/api/facility-qa-assignments?company_id=${companyId}`),
      ])
      if (!facRes.ok || !asgRes.ok) throw new Error('Failed to load data')
      const [fac, asg] = await Promise.all([facRes.json(), asgRes.json()])
      setFacilities(Array.isArray(fac) ? fac : [])
      setUsers(users)
      const assignmentRows = Array.isArray(asg) ? asg : []
      setAssignments(
        assignmentRows.filter(
          (row) => row.role_type === 'facility_manager' || row.role_type === 'qa_executive'
        )
      )
      if (!facilityId && Array.isArray(fac) && fac[0]?.id) setFacilityId(fac[0].id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [companyId, roleType])

  const facilityNameById = useMemo(() => {
    const m = new Map<string, string>()
    facilities.forEach((f) => m.set(f.id, f.name))
    return m
  }, [facilities])

  const userLabel = (u: UserRow) => u.full_name || u.email || u.id

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !facilityId) return
    setSaving(true)
    try {
      const res = await fetch('/api/facility-qa-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          facility_id: facilityId,
          company_id: companyId,
          role_type: roleType,
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

  const handleRemove = async (user_id: string, facility_id: string, assignmentRoleType: string) => {
    if (!confirm('Remove this assignment?')) return
    const qs = new URLSearchParams({
      user_id,
      facility_id,
      company_id: companyId,
      role_type: assignmentRoleType,
    })
    const res = await fetch(`/api/facility-qa-assignments?${qs}`, { method: 'DELETE' })
    if (!res.ok) {
      const d = await res.json()
      alert(d.error || 'Failed')
      return
    }
    await load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#081636]">Facility assignments</h1>
        <p className="mt-1 text-sm text-[#081636]">
          {companyName} — assign facility managers and QA executives to facilities.
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <p className="text-sm font-medium text-[#081636]">New assignment</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Role</label>
            <select
              value={roleType}
              onChange={(e) => {
                setRoleType(e.target.value as AssignmentRoleType)
                setUserId('')
              }}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black"
              required
            >
              <option value="facility_manager">Manager</option>
              <option value="qa_executive">Executive</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">User</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black"
              required
            >
              <option value="">Select user</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {userLabel(u)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Facility</label>
            <select
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black"
              required
            >
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
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
                <th className="px-4 py-3 text-left font-semibold text-[#081636]">Facility</th>
                <th className="px-4 py-3 text-right font-semibold text-[#081636]"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assignments.map((a) => {
                const u = users.find((x) => x.id === a.user_id)
                return (
                  <tr key={`${a.user_id}-${a.facility_id}`}>
                    <td className="px-4 py-3 text-[#081636]">{u ? userLabel(u) : a.user_id}</td>
                    <td className="px-4 py-3 text-gray-700">{roleTypeLabel(a.role_type)}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {facilityNameById.get(a.facility_id) ?? a.facility_id}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          handleRemove(a.user_id, a.facility_id, a.role_type || 'facility_manager')
                        }
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
