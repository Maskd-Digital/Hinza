'use client'

import { useState, useEffect } from 'react'
import { Facility } from '@/types/facility'
import { Permission } from '@/types/auth'
import { hasPermission } from '@/lib/auth/permissions'

interface FacilitiesListPageProps {
  companyId: string
  companyName: string
  userPermissions: Permission[]
}

interface UserOption {
  id: string
  full_name: string | null
  email: string | null
  roles?: Array<{ id: string; name: string }>
}

function roleNameIncludes(roleName: string | undefined, value: string): boolean {
  return (roleName ?? '').toLowerCase().includes(value)
}

export default function FacilitiesListPage({
  companyId,
  companyName,
  userPermissions,
}: FacilitiesListPageProps) {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [users, setUsers] = useState<UserOption[]>([])
  const [selectedFacilityManagerIds, setSelectedFacilityManagerIds] = useState<string[]>([])
  const [selectedQaExecutiveIds, setSelectedQaExecutiveIds] = useState<string[]>([])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    phone: '',
    email: '',
  })

  const canCreate = hasPermission(userPermissions, 'facilities:create')
  const canUpdate = hasPermission(userPermissions, 'facilities:update')
  const canDelete = hasPermission(userPermissions, 'facilities:delete')
  const canAssignFacilityManagers = hasPermission(userPermissions, 'facility_managers:assign')
  const canAssignQa = hasPermission(userPermissions, 'department_qa:assign')

  useEffect(() => {
    fetchFacilities()
  }, [companyId])

  const fetchFacilities = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/facilities?company_id=${companyId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch facilities')
      }
      const data = await response.json()
      setFacilities(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load facilities')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      phone: '',
      email: '',
    })
    setFormError(null)
    setEditingFacility(null)
    setShowAddModal(false)
    setSelectedFacilityManagerIds([])
    setSelectedQaExecutiveIds([])
  }

  const handleEdit = (facility: Facility) => {
    setFormData({
      name: facility.name,
      description: facility.description || '',
      address: facility.address || '',
      city: facility.city || '',
      state: facility.state || '',
      country: facility.country || '',
      postal_code: facility.postal_code || '',
      phone: facility.phone || '',
      email: facility.email || '',
    })
    setEditingFacility(facility)
    setShowAddModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setFormError('Facility name is required')
      return
    }

    setFormLoading(true)
    setFormError(null)

    try {
      const url = editingFacility
        ? `/api/facilities/${editingFacility.id}`
        : '/api/facilities'
      const method = editingFacility ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          company_id: companyId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save facility')
      }

      const savedFacility = await response.json()

      if (!editingFacility && savedFacility?.id) {
        const assignmentRequests: Array<Promise<Response>> = []

        if (canAssignFacilityManagers && selectedFacilityManagerIds.length > 0) {
          selectedFacilityManagerIds.forEach((userId) => {
            assignmentRequests.push(
              fetch('/api/facility-qa-assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  user_id: userId,
                  facility_id: savedFacility.id,
                  company_id: companyId,
                  role_type: 'facility_manager',
                }),
              })
            )
          })
        }

        if (canAssignQa && selectedQaExecutiveIds.length > 0) {
          selectedQaExecutiveIds.forEach((userId) => {
            assignmentRequests.push(
              fetch('/api/facility-qa-assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  user_id: userId,
                  facility_id: savedFacility.id,
                  company_id: companyId,
                  role_type: 'qa_executive',
                }),
              })
            )
          })
        }

        if (assignmentRequests.length > 0) {
          const assignmentResponses = await Promise.all(assignmentRequests)
          const failedAssignment = assignmentResponses.find((res) => !res.ok)
          if (failedAssignment) {
            const data = await failedAssignment.json().catch(() => ({}))
            throw new Error(data.error || 'Facility created but assignment failed')
          }
        }
      }

      await fetchFacilities()
      resetForm()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (facility: Facility) => {
    if (!confirm(`Are you sure you want to delete "${facility.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/facilities/${facility.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete facility')
      }

      await fetchFacilities()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete facility')
    }
  }

  const handleToggleActive = async (facility: Facility) => {
    try {
      const response = await fetch(`/api/facilities/${facility.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !facility.is_active }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update facility')
      }

      await fetchFacilities()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update facility')
    }
  }

  const filteredFacilities = facilities.filter(
    (facility) =>
      facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.country?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeFacilities = filteredFacilities.filter((f) => f.is_active)
  const inactiveFacilities = filteredFacilities.filter((f) => !f.is_active)

  const loadUsersForAssignments = async () => {
    if (!canAssignFacilityManagers && !canAssignQa) return
    try {
      const response = await fetch(`/api/users?company_id=${companyId}`)
      if (!response.ok) return
      const data = await response.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch {
      setUsers([])
    }
  }

  const toggleSelection = (
    userId: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setSelected(
      selected.includes(userId)
        ? selected.filter((id) => id !== userId)
        : [...selected, userId]
    )
  }

  const facilityManagerUsers = users.filter((user) =>
    user.roles?.some((role) => {
      const roleName = role.name?.toLowerCase()
      return roleNameIncludes(roleName, 'facility manager') || roleNameIncludes(roleName, 'facility admin')
    })
  )

  const qaExecutiveUsers = users.filter((user) =>
    user.roles?.some((role) => roleNameIncludes(role.name?.toLowerCase(), 'qa executive'))
  )

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#081636]">Facilities</h1>
          <p className="text-sm text-[#081636]">
            Manage locations and facilities for {companyName}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => {
              loadUsersForAssignments()
              setShowAddModal(true)
            }}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            style={{ backgroundColor: '#0108B8', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Facility
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-white p-4" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
          <p className="text-sm text-[#081636]">Total Facilities</p>
          <p className="text-2xl font-bold text-[#081636]">{facilities.length}</p>
        </div>
        <div className="rounded-lg bg-white p-4" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
          <p className="text-sm text-[#081636]">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {facilities.filter((f) => f.is_active).length}
          </p>
        </div>
        <div className="rounded-lg bg-white p-4" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
          <p className="text-sm text-[#081636]">Inactive</p>
          <p className="text-2xl font-bold text-[#081636]">
            {facilities.filter((f) => !f.is_active).length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search facilities by name, city, or country..."
            className="w-full rounded-lg border border-gray-300 px-4 py-2 pl-10 text-[#081636] placeholder:text-[#081636] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            style={{ backgroundColor: '#FFFFFF', boxShadow: 'inset 0 2px 4px rgba(1, 8, 184, 0.25)' }}
          />
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#081636]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-4 text-center" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
          <p className="text-sm text-red-800">{error}</p>
          <button
            onClick={fetchFacilities}
            className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
          >
            Try again
          </button>
        </div>
      ) : filteredFacilities.length === 0 ? (
        <div className="rounded-lg bg-white py-12 text-center" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
          <svg
            className="mx-auto h-12 w-12 text-[#081636]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <p className="mt-4 text-[#081636]">
            {searchTerm ? 'No facilities match your search' : 'No facilities yet'}
          </p>
          {canCreate && !searchTerm && (
            <button
              onClick={() => {
                loadUsersForAssignments()
                setShowAddModal(true)
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              style={{ backgroundColor: '#0108B8', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}
            >
              Add First Facility
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFacilities.map((facility) => (
            <div
              key={facility.id}
              className={`rounded-lg bg-white p-4 ${
                !facility.is_active ? 'bg-gray-50' : ''
              }`}
              style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-[#081636]">{facility.name}</h3>
                    {!facility.is_active && (
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-[#081636]">
                        Inactive
                      </span>
                    )}
                  </div>
                  {facility.description && (
                    <p className="mt-1 text-sm text-[#081636]">{facility.description}</p>
                  )}

                  {/* Location */}
                  {(facility.address ||
                    facility.city ||
                    facility.state ||
                    facility.country) && (
                    <div className="mt-2 flex items-start gap-2">
                      <svg
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#081636]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <p className="text-sm text-[#081636]">
                        {[
                          facility.address,
                          facility.city,
                          facility.state,
                          facility.country,
                          facility.postal_code,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  )}

                  {/* Contact */}
                  <div className="mt-2 flex flex-wrap gap-4">
                    {facility.phone && (
                      <div className="flex items-center gap-1 text-sm text-[#081636]">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        {facility.phone}
                      </div>
                    )}
                    {facility.email && (
                      <div className="flex items-center gap-1 text-sm text-[#081636]">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        {facility.email}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {(canUpdate || canDelete) && (
                  <div className="flex gap-2">
                    {canUpdate && (
                      <>
                        <button
                          onClick={() => handleToggleActive(facility)}
                          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                            facility.is_active
                              ? 'text-[#081636] hover:bg-gray-100'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {facility.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleEdit(facility)}
                          className="rounded-lg px-3 py-1.5 text-sm font-medium hover:opacity-80"
                          style={{ color: '#2563EB' }}
                        >
                          Edit
                        </button>
                      </>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(facility)}
                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl mx-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#081636]">
                {editingFacility ? 'Edit Facility' : 'Add New Facility'}
              </h2>
              <button
                onClick={resetForm}
                className="rounded-lg p-1 text-[#081636] hover:bg-gray-100 hover:text-[#081636]"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="rounded-lg bg-red-50 p-3" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
                  <p className="text-sm text-red-800">{formError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#081636]">
                    Facility Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-[#081636] shadow-sm placeholder:text-[#081636] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Headquarters, Branch Office"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#081636]">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={2}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-[#081636] shadow-sm placeholder:text-[#081636] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Brief description"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#081636]">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-[#081636] shadow-sm placeholder:text-[#081636] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Street address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#081636]">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-[#081636] shadow-sm placeholder:text-[#081636] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#081636]">
                    State/Province
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-[#081636] shadow-sm placeholder:text-[#081636] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="State or Province"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#081636]">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-[#081636] shadow-sm placeholder:text-[#081636] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Country"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#081636]">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) =>
                      setFormData({ ...formData, postal_code: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-[#081636] shadow-sm placeholder:text-[#081636] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Postal/ZIP code"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#081636]">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-[#081636] shadow-sm placeholder:text-[#081636] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#081636]">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-[#081636] shadow-sm placeholder:text-[#081636] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Facility email"
                  />
                </div>

                {!editingFacility && (canAssignQa || canAssignFacilityManagers) && (
                  <div className="md:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {canAssignQa && (
                      <div className="rounded-lg border border-gray-200 p-3">
                        <p className="text-sm font-medium text-[#081636]">Assign QA Executives</p>
                        <p className="text-xs text-[#081636] mt-1">
                          Optional: assign QA executives while creating this facility.
                        </p>
                        <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
                          {qaExecutiveUsers.length === 0 ? (
                            <p className="text-xs text-gray-500">No QA Executive users found.</p>
                          ) : (
                            qaExecutiveUsers.map((user) => (
                              <label key={user.id} className="flex items-center gap-2 text-sm text-[#081636]">
                                <input
                                  type="checkbox"
                                  checked={selectedQaExecutiveIds.includes(user.id)}
                                  onChange={() =>
                                    toggleSelection(
                                      user.id,
                                      selectedQaExecutiveIds,
                                      setSelectedQaExecutiveIds
                                    )
                                  }
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>{user.full_name || user.email || user.id}</span>
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {canAssignFacilityManagers && (
                      <div className="rounded-lg border border-gray-200 p-3">
                        <p className="text-sm font-medium text-[#081636]">Assign Facility Managers</p>
                        <p className="text-xs text-[#081636] mt-1">
                          Optional: assign facility managers while creating this facility.
                        </p>
                        <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
                          {facilityManagerUsers.length === 0 ? (
                            <p className="text-xs text-gray-500">No Facility Manager users found.</p>
                          ) : (
                            facilityManagerUsers.map((user) => (
                              <label key={user.id} className="flex items-center gap-2 text-sm text-[#081636]">
                                <input
                                  type="checkbox"
                                  checked={selectedFacilityManagerIds.includes(user.id)}
                                  onChange={() =>
                                    toggleSelection(
                                      user.id,
                                      selectedFacilityManagerIds,
                                      setSelectedFacilityManagerIds
                                    )
                                  }
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>{user.full_name || user.email || user.id}</span>
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#081636] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading || !formData.name.trim()}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: '#0108B8', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}
                >
                  {formLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : editingFacility ? (
                    'Update Facility'
                  ) : (
                    'Create Facility'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
