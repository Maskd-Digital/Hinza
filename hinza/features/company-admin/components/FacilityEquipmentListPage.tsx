'use client'

import { useState, useEffect, useMemo } from 'react'
import type { FacilityEquipment } from '@/types/facility-equipment'
import type { Permission } from '@/types/auth'
import { hasPermission } from '@/lib/auth/permissions'

interface FacilityRow {
  id: string
  name: string
}

interface FacilityEquipmentListPageProps {
  companyId: string
  companyName: string
  userPermissions: Permission[]
}

export default function FacilityEquipmentListPage({
  companyId,
  companyName,
  userPermissions,
}: FacilityEquipmentListPageProps) {
  const [items, setItems] = useState<FacilityEquipment[]>([])
  const [facilities, setFacilities] = useState<FacilityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [facilityFilter, setFacilityFilter] = useState<string>('')

  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [facilityId, setFacilityId] = useState('')
  const [assetTag, setAssetTag] = useState('')
  const [model, setModel] = useState('')
  const [saving, setSaving] = useState(false)

  const canCreate = hasPermission(userPermissions, 'facility_equipment:create')
  const canUpdate = hasPermission(userPermissions, 'facility_equipment:update')
  const canDelete = hasPermission(userPermissions, 'facility_equipment:delete')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [eqRes, facRes] = await Promise.all([
        fetch(`/api/facility-equipment?company_id=${companyId}`),
        fetch(`/api/facilities?company_id=${companyId}`),
      ])
      if (!eqRes.ok) throw new Error('Failed to load equipment')
      if (!facRes.ok) throw new Error('Failed to load facilities')
      const eq = await eqRes.json()
      const fac = await facRes.json()
      setItems(Array.isArray(eq) ? eq : [])
      setFacilities(Array.isArray(fac) ? fac : [])
      if (!facilityId && Array.isArray(fac) && fac[0]?.id) setFacilityId(fac[0].id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [companyId])

  const facilityNameById = useMemo(() => {
    const m = new Map<string, string>()
    facilities.forEach((f) => m.set(f.id, f.name))
    return m
  }, [facilities])

  const filtered = useMemo(() => {
    if (!facilityFilter) return items
    return items.filter((i) => i.facility_id === facilityFilter)
  }, [items, facilityFilter])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !facilityId) return
    setSaving(true)
    try {
      const res = await fetch('/api/facility-equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          facility_id: facilityId,
          name: name.trim(),
          asset_tag: assetTag.trim() || null,
          model: model.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create')
      setFormOpen(false)
      setName('')
      setAssetTag('')
      setModel('')
      await load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (row: FacilityEquipment) => {
    if (!canUpdate) return
    const res = await fetch(`/api/facility-equipment/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !row.is_active }),
    })
    if (!res.ok) {
      const d = await res.json()
      alert(d.error || 'Update failed')
      return
    }
    await load()
  }

  const remove = async (id: string) => {
    if (!canDelete || !confirm('Delete this equipment record?')) return
    const res = await fetch(`/api/facility-equipment/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const d = await res.json()
      alert(d.error || 'Delete failed')
      return
    }
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#081636]">Facility equipment</h1>
          <p className="mt-1 text-sm text-[#081636]">{companyName}</p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setFormOpen((o) => !o)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: '#0108B8' }}
          >
            {formOpen ? 'Close form' : 'Add equipment'}
          </button>
        )}
      </div>

      {formOpen && canCreate && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-gray-600">Facility</label>
              <select
                value={facilityId}
                onChange={(e) => setFacilityId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                required
              >
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
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
              <label className="text-xs font-medium text-gray-600">Asset tag</label>
              <input
                value={assetTag}
                onChange={(e) => setAssetTag(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Model</label>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 rounded-lg bg-[#0108B8] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-600">Filter by facility:</span>
        <select
          value={facilityFilter}
          onChange={(e) => setFacilityFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All</option>
          {facilities.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500">No equipment records yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-[#081636]">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-[#081636]">Facility</th>
                <th className="px-4 py-3 text-left font-semibold text-[#081636]">Asset tag</th>
                <th className="px-4 py-3 text-left font-semibold text-[#081636]">Model</th>
                <th className="px-4 py-3 text-left font-semibold text-[#081636]">Active</th>
                <th className="px-4 py-3 text-right font-semibold text-[#081636]"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-medium text-[#081636]">{row.name}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {facilityNameById.get(row.facility_id) ?? row.facility_id}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{row.asset_tag ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{row.model ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{row.is_active ? 'Yes' : 'No'}</td>
                  <td className="space-x-2 px-4 py-3 text-right">
                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => toggleActive(row)}
                        className="text-sm font-medium text-[#0108B8] hover:underline"
                      >
                        {row.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => remove(row.id)}
                        className="text-sm font-medium text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
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
