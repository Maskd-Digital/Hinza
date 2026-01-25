'use client'

import { useState } from 'react'

interface Step1GeneralDetailsProps {
  initialData: {
    name: string
    admin_email: string
    admin_name: string
  }
  onSubmit: (data: {
    name: string
    admin_email: string
    admin_name: string
  }) => Promise<void>
  loading: boolean
}

export default function Step1GeneralDetails({
  initialData,
  onSubmit,
  loading,
}: Step1GeneralDetailsProps) {
  const [formData, setFormData] = useState(initialData)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-gray-900">
        Step 1: General Company Details
      </h2>
      <p className="mb-6 text-sm text-gray-600">
        Provide the basic information for the company and its initial administrator.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="Enter company name"
          />
        </div>

        <div>
          <label
            htmlFor="admin_name"
            className="block text-sm font-medium text-gray-700"
          >
            Admin Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="admin_name"
            required
            value={formData.admin_name}
            onChange={(e) =>
              setFormData({ ...formData, admin_name: e.target.value })
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="Enter admin full name"
          />
        </div>

        <div>
          <label
            htmlFor="admin_email"
            className="block text-sm font-medium text-gray-700"
          >
            Admin Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="admin_email"
            required
            value={formData.admin_email}
            onChange={(e) =>
              setFormData({ ...formData, admin_email: e.target.value })
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="Enter admin email address"
          />
          <p className="mt-1 text-xs text-gray-500">
            An invitation will be sent to this email address.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creating Company...' : 'Create Company & Continue'}
          </button>
        </div>
      </form>
    </div>
  )
}
