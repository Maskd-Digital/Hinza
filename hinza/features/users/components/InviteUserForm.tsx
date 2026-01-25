'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Role } from '@/types/auth'

interface InviteUserFormProps {
  defaultCompanyId?: string
}

export default function InviteUserForm({
  defaultCompanyId,
}: InviteUserFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    confirmPassword: '',
    company_id: defaultCompanyId || '',
    role_ids: [] as string[],
  })

  useEffect(() => {
    if (formData.company_id) {
      // Fetch roles for the company
      fetch(`/api/roles?company_id=${formData.company_id}`)
        .then((res) => res.json())
        .then((data) => setRoles(data))
        .catch(() => setRoles([]))
    }
  }, [formData.company_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate password
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          full_name: formData.full_name,
          password: formData.password,
          company_id: formData.company_id,
          role_ids: formData.role_ids,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create user')
      }

      router.push('/users')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl rounded-lg border border-gray-200 bg-white p-6 shadow">
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
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Initial Password <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="Minimum 6 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            User can change this password after logging in
          </p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700"
          >
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="confirmPassword"
            required
            minLength={6}
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-500 focus:outline-none focus:ring-1 ${
              formData.confirmPassword && formData.password !== formData.confirmPassword
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
            placeholder="Re-enter password"
          />
          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
          )}
        </div>

        <div>
          <label
            htmlFor="role_ids"
            className="block text-sm font-medium text-gray-700"
          >
            Roles
          </label>
          <select
            id="role_ids"
            multiple
            value={formData.role_ids}
            onChange={(e) => {
              const selected = Array.from(
                e.target.selectedOptions,
                (option) => option.value
              )
              setFormData({ ...formData, role_ids: selected })
            }}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            size={5}
          >
            {roles.length > 0 ? (
              roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))
            ) : (
              <option disabled>No roles available. Select a company first.</option>
            )}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Hold Ctrl/Cmd to select multiple roles
          </p>
        </div>

        <div>
          <label
            htmlFor="company_id"
            className="block text-sm font-medium text-gray-700"
          >
            Company ID
          </label>
          <input
            type="text"
            id="company_id"
            required
            value={formData.company_id}
            onChange={(e) =>
              setFormData({ ...formData, company_id: e.target.value })
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="Enter company ID"
          />
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
            disabled={loading || (formData.password !== formData.confirmPassword)}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  )
}
