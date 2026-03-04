'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/Modal'
import { Role } from '@/types/auth'

interface ViewUsersByRoleModalProps {
  isOpen: boolean
  onClose: () => void
  role: Role | null
  companyId: string
}

interface UserRow {
  id: string
  full_name: string | null
  email: string | null
  is_active: boolean
  roles?: Array<{ id: string; name: string }>
}

export default function ViewUsersByRoleModal({
  isOpen,
  onClose,
  role,
  companyId,
}: ViewUsersByRoleModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<UserRow[]>([])

  useEffect(() => {
    if (isOpen && role && companyId) {
      setError(null)
      setLoading(true)
      fetch(`/api/users?company_id=${companyId}&role_id=${role.id}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch users')
          return res.json()
        })
        .then(setUsers)
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
        .finally(() => setLoading(false))
    } else {
      setUsers([])
    }
  }, [isOpen, role, companyId])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={role ? `Users with role: ${role.name}` : 'Users by role'}
      size="xl"
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-[#081636]">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="py-8 text-center text-[#081636]">
            No users have this role.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="whitespace-nowrap px-4 py-2 text-sm text-[#081636]">
                      {u.full_name ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-sm text-[#081636]">
                      {u.email ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-[#081636] hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
