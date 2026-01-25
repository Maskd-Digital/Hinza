'use client'

import { useState } from 'react'

interface FacilityData {
  name: string
  description?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  phone?: string
  email?: string
}

interface Step5CreateFacilitiesProps {
  companyId: string
  initialFacilities: FacilityData[]
  onUpdate: (facilities: FacilityData[]) => void
  onSkip: () => void
  onSubmit: () => void
  loading: boolean
}

export default function Step5CreateFacilities({
  companyId,
  initialFacilities,
  onUpdate,
  onSkip,
  onSubmit,
  loading,
}: Step5CreateFacilitiesProps) {
  const [facilities, setFacilities] = useState<FacilityData[]>(initialFacilities)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState<FacilityData>({
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
    setEditingIndex(null)
    setShowAddForm(false)
  }

  const handleAddFacility = () => {
    if (!formData.name.trim()) return

    const newFacilities = [...facilities, formData]
    setFacilities(newFacilities)
    onUpdate(newFacilities)
    resetForm()
  }

  const handleUpdateFacility = () => {
    if (editingIndex === null || !formData.name.trim()) return

    const newFacilities = [...facilities]
    newFacilities[editingIndex] = formData
    setFacilities(newFacilities)
    onUpdate(newFacilities)
    resetForm()
  }

  const handleEdit = (index: number) => {
    setFormData(facilities[index])
    setEditingIndex(index)
    setShowAddForm(true)
  }

  const handleRemove = (index: number) => {
    const newFacilities = facilities.filter((_, i) => i !== index)
    setFacilities(newFacilities)
    onUpdate(newFacilities)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Create Facilities
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Add facilities, locations, or branches for this company. You can skip
          this step and add facilities later.
        </p>
      </div>

      {/* Facilities List */}
      {facilities.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-3 text-sm font-medium text-gray-700">
            Added Facilities ({facilities.length})
          </h3>
          <div className="space-y-2">
            {facilities.map((facility, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{facility.name}</p>
                  {(facility.city || facility.state || facility.country) && (
                    <p className="text-sm text-gray-500">
                      {[facility.city, facility.state, facility.country]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                  {facility.description && (
                    <p className="text-xs text-gray-400 mt-1">
                      {facility.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(index)}
                    className="rounded-md px-2 py-1 text-sm text-blue-600 hover:bg-blue-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="rounded-md px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Facility Form */}
      {showAddForm ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-4 text-lg font-medium text-gray-900">
            {editingIndex !== null ? 'Edit Facility' : 'Add New Facility'}
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Facility Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="e.g., Headquarters, Branch Office, Warehouse"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Brief description of the facility"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Street address"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="City"
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                State/Province
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="State or Province"
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Country
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Country"
              />
            </div>

            {/* Postal Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Postal Code
              </label>
              <input
                type="text"
                value={formData.postal_code}
                onChange={(e) =>
                  setFormData({ ...formData, postal_code: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Postal/ZIP code"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Phone number"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Facility email"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={
                editingIndex !== null ? handleUpdateFacility : handleAddFacility
              }
              disabled={!formData.name.trim()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {editingIndex !== null ? 'Update Facility' : 'Add Facility'}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-6 text-gray-500 hover:border-blue-500 hover:text-blue-500"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Add Facility
        </button>
      )}

      {/* Actions */}
      <div className="flex justify-between border-t border-gray-200 pt-6">
        <div />
        <div className="space-x-4">
          <button
            type="button"
            onClick={onSkip}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            {facilities.length > 0 ? 'Skip & Finish' : 'Skip'}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Finish Setup'}
          </button>
        </div>
      </div>
    </div>
  )
}
