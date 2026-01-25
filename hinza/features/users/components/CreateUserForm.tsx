'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CreateUserInput {
  email: string
  full_name: string
  auth_user_id?: string
}

const SYSTEM_COMPANY_ID = '00000000-0000-0000-0000-000000000001'

export default function CreateUserForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateUserInput>({
    email: '',
    full_name: '',
    auth_user_id: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          full_name: formData.full_name,
          company_id: SYSTEM_COMPANY_ID,
          auth_user_id: formData.auth_user_id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create superadmin user')
      }

      // Navigate to users page and refresh to show the new user
      router.push('/users')
      // Force a refresh of the server component data
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl rounded-lg border border-gray-200 bg-white p-6 shadow">
      <div className="mb-4 rounded-md bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This form creates a new superadmin user. The
          user will be assigned to the System company and given the Superadmin
          role with all permissions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="Enter user email"
          />
          <p className="mt-1 text-xs text-gray-500">
            The user must already exist in Supabase Auth. If not, create the
            user in Supabase Auth first.
          </p>
        </div>

        <div>
          <label
            htmlFor="full_name"
            className="block text-sm font-medium text-gray-700"
          >
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="full_name"
            required
            value={formData.full_name}
            onChange={(e) =>
              setFormData({ ...formData, full_name: e.target.value })
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="Enter user full name"
          />
        </div>

        <div>
          <label
            htmlFor="auth_user_id"
            className="block text-sm font-medium text-gray-700"
          >
            Auth User ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="auth_user_id"
            required
            value={formData.auth_user_id || ''}
            onChange={(e) =>
              setFormData({ ...formData, auth_user_id: e.target.value })
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="Enter Supabase Auth user ID"
          />
          <p className="mt-1 text-xs text-gray-500">
            The user must already exist in Supabase Auth. Find their user ID in
            Supabase Dashboard → Authentication → Users.
          </p>
        </div>

        <div className="rounded-md bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-700">Auto-assigned:</p>
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            <li>• Company: System</li>
            <li>• Role: Superadmin (with all permissions)</li>
          </ul>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Superadmin'}
          </button>
        </div>
      </form>
    </div>
  )
}
