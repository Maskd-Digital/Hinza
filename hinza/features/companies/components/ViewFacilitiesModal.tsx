'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/Modal'
import { Facility } from '@/types/facility'

interface ViewFacilitiesModalProps {
  isOpen: boolean
  onClose: () => void
  companyId: string
  companyName: string
}

export default function ViewFacilitiesModal({
  isOpen,
  onClose,
  companyId,
  companyName,
}: ViewFacilitiesModalProps) {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (isOpen && companyId) {
      fetchFacilities()
    }
  }, [isOpen, companyId])

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

  const filteredFacilities = facilities.filter((facility) =>
    facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    facility.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    facility.country?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeFacilities = filteredFacilities.filter((f) => f.is_active)
  const inactiveFacilities = filteredFacilities.filter((f) => !f.is_active)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Facilities - ${companyName}`}
      size="xl"
    >
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search facilities by name, city, or country..."
            className="w-full rounded-lg border border-gray-300 px-4 py-2 pl-10 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
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

        {/* Stats */}
        <div className="flex gap-4 text-sm">
          <span className="rounded-full bg-green-100 px-3 py-1 text-green-800">
            {activeFacilities.length} Active
          </span>
          {inactiveFacilities.length > 0 && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">
              {inactiveFacilities.length} Inactive
            </span>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={fetchFacilities}
              className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
            >
              Try again
            </button>
          </div>
        ) : filteredFacilities.length === 0 ? (
          <div className="py-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
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
            <p className="mt-4 text-gray-500">
              {searchTerm ? 'No facilities match your search' : 'No facilities found'}
            </p>
          </div>
        ) : (
          <div className="max-h-96 space-y-3 overflow-y-auto">
            {filteredFacilities.map((facility) => (
              <div
                key={facility.id}
                className={`rounded-lg border p-4 ${
                  facility.is_active
                    ? 'border-gray-200 bg-white'
                    : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{facility.name}</h4>
                      {!facility.is_active && (
                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                          Inactive
                        </span>
                      )}
                    </div>
                    {facility.description && (
                      <p className="mt-1 text-sm text-gray-500">
                        {facility.description}
                      </p>
                    )}
                    
                    {/* Location Info */}
                    {(facility.address || facility.city || facility.state || facility.country) && (
                      <div className="mt-2 flex items-start gap-2">
                        <svg
                          className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400"
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
                        <p className="text-sm text-gray-600">
                          {[facility.address, facility.city, facility.state, facility.country, facility.postal_code]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      </div>
                    )}

                    {/* Contact Info */}
                    <div className="mt-2 flex flex-wrap gap-4">
                      {facility.phone && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
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
                        <div className="flex items-center gap-1 text-sm text-gray-500">
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
