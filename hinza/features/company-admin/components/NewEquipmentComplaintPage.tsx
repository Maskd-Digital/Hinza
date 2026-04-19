'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface FacilityRow {
  id: string
  name: string
}

interface EquipmentRow {
  id: string
  name: string
  facility_id: string
}

interface DepartmentRow {
  id: string
  name: string
}

interface NewEquipmentComplaintPageProps {
  companyId: string
  companyName: string
}

export default function NewEquipmentComplaintPage({
  companyId,
  companyName,
}: NewEquipmentComplaintPageProps) {
  const router = useRouter()
  const [departments, setDepartments] = useState<DepartmentRow[]>([])
  const [facilities, setFacilities] = useState<FacilityRow[]>([])
  const [equipment, setEquipment] = useState<EquipmentRow[]>([])
  const [departmentId, setDepartmentId] = useState('')
  const [facilityId, setFacilityId] = useState('')
  const [equipmentId, setEquipmentId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [depRes, facRes] = await Promise.all([
          fetch(`/api/departments?company_id=${companyId}`),
          fetch(`/api/facilities?company_id=${companyId}`),
        ])
        const dep = await depRes.json()
        const fac = await facRes.json()
        if (!cancelled && Array.isArray(dep)) {
          setDepartments(dep)
          if (dep[0]?.id) setDepartmentId(dep[0].id)
        }
        if (!cancelled && Array.isArray(fac)) {
          setFacilities(fac)
          if (fac[0]?.id) setFacilityId(fac[0].id)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [companyId])

  useEffect(() => {
    if (!facilityId) {
      setEquipment([])
      setEquipmentId('')
      return
    }
    let cancelled = false
    ;(async () => {
      const res = await fetch(
        `/api/facility-equipment?company_id=${companyId}&facility_id=${facilityId}`
      )
      const data = await res.json()
      if (cancelled) return
      const list = Array.isArray(data) ? data : []
      setEquipment(list)
      setEquipmentId(list[0]?.id ?? '')
    })()
    return () => {
      cancelled = true
    }
  }, [companyId, facilityId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !departmentId || !facilityId || !equipmentId) return
    setSaving(true)
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          title: title.trim(),
          description: description.trim() || null,
          department_id: departmentId,
          facility_id: facilityId,
          equipment_id: equipmentId,
          priority: priority || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create')
      router.push(`/company-admin/${companyId}/complaints/${data.id}`)
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="p-6 text-sm text-gray-500">Loading…</p>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-[#081636]">New equipment complaint</h1>
        <p className="mt-1 text-sm text-[#081636]">{companyName}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="text-xs font-medium text-gray-600">Department</label>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            required
          >
            {departments.length === 0 ? (
              <option value="">Create departments first</option>
            ) : (
              departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))
            )}
          </select>
        </div>
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
          <label className="text-xs font-medium text-gray-600">Equipment</label>
          <select
            value={equipmentId}
            onChange={(e) => setEquipmentId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            required
          >
            {equipment.length === 0 ? (
              <option value="">No equipment for this facility</option>
            ) : (
              equipment.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">—</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || !equipmentId || !departmentId}
            className="rounded-lg bg-[#0108B8] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? 'Submitting…' : 'Submit complaint'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-[#081636]"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
