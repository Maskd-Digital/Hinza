'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Permission } from '@/types/auth'
import Modal from '@/components/Modal'

interface AddRoleModalProps {
  isOpen: boolean
  onClose: () => void
  companyId: string
}

export default function AddRoleModal({
  isOpen,
  onClose,
  companyId,
}: AddRoleModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [roleName, setRoleName] = useState('')
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([])

  useEffect(() => {
    if (isOpen) {
      // Fetch all permissions
      fetch('/api/permissions')
        .then((res) => res.json())
        .then((data) => setPermissions(data))
        .catch(() => setPermissions([]))
    }
  }, [isOpen])

  const togglePermission = (permissionId: number) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: roleName,
          company_id: companyId,
          permission_ids: selectedPermissionIds,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create role')
      }

      // Success - close modal and refresh
      onClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  const handleClose = () => {
    setRoleName('')
    setSelectedPermissionIds([])
    setError(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Role" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Role Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-[#081636] shadow-sm placeholder:text-[#081636] focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="e.g., QA Manager, Company Admin"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Permissions
          </label>
          <div className="max-h-60 space-y-2 overflow-y-auto rounded-md border border-gray-200 p-4">
            {permissions.length === 0 ? (
              <p className="text-sm text-[#081636]">Loading permissions...</p>
            ) : (
              permissions.map((permission) => (
                <label
                  key={permission.id}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissionIds.includes(permission.id)}
                    onChange={() => togglePermission(permission.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {permission.name}
                  </span>
                  {permission.description && (
                    <span className="text-xs text-[#081636]">
                      - {permission.description}
                    </span>
                  )}
                </label>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4 border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !roleName.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Role'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
