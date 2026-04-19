'use client'

import { useState, useEffect } from 'react'
import type { Permission } from '@/types/auth'
import { hasPermission } from '@/lib/auth/permissions'
import type { Department } from '@/types/department'

interface DepartmentsPageProps {
  companyId: string
  companyName: string
  userPermissions: Permission[]
}

export default function DepartmentsPage({
  companyId,
  companyName,
  userPermissions,
}: DepartmentsPageProps) {
  const canRead = hasPermission(userPermissions, 'departments:read')
  const canManage = hasPermission(userPermissions, 'departments:manage')

  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/departments?company_id=${companyId}`)
      if (!res.ok) throw new Error('Failed to load departments')
      const data = await res.json()
      setDepartments(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [companyId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          name: name.trim(),
          code: code.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create')
      setName('')
      setCode('')
      await load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this department? Complaints referencing it may be affected.')) return
    const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const d = await res.json()
      alert(d.error || 'Failed')
      return
    }
    await load()
  }

  if (!canRead) {
    return <p className="text-sm text-gray-600">You do not have permission to view departments.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#081636]">Departments</h1>
        <p className="mt-1 text-sm text-[#081636]">
          {companyName} — business departments used to route complaints (e.g. Sales &amp; Retail,
          Manufacturing).
        </p>
      </div>

      {canManage && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <p className="text-sm font-medium text-[#081636]">Add department</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-gray-600">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Code (optional)</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 rounded-lg bg-[#0108B8] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Create'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : departments.length === 0 ? (
        <p className="text-sm text-gray-500">No departments yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-[#081636]">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-[#081636]">Code</th>
                {canManage && (
                  <th className="px-4 py-3 text-right font-semibold text-[#081636]"> </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {departments.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3 font-medium text-[#081636]">{d.name}</td>
                  <td className="px-4 py-3 text-gray-700">{d.code ?? '—'}</td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(d.id)}
                        className="text-sm font-medium text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
