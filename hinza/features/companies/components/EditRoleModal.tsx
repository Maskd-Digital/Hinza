'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Permission, Role } from '@/types/auth'
import Modal from '@/components/Modal'

interface EditRoleModalProps {
  isOpen: boolean
  onClose: () => void
  role: Role | null
  companyId: string
  onSuccess?: () => void
}

export default function EditRoleModal({
  isOpen,
  onClose,
  role,
  companyId,
  onSuccess,
}: EditRoleModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [roleName, setRoleName] = useState('')
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([])

  // Load role data when modal opens
  useEffect(() => {
    if (isOpen && role) {
      setRoleName(role.name)
      loadRolePermissions()
      loadAllPermissions()
    }
  }, [isOpen, role])

  const loadAllPermissions = async () => {
    try {
      const response = await fetch('/api/permissions')
      if (response.ok) {
        const data = await response.json()
        setPermissions(data)
      }
    } catch {
      setPermissions([])
    }
  }

  const loadRolePermissions = async () => {
    if (!role) return

    try {
      const response = await fetch(`/api/permissions?role_id=${role.id}`)
      if (response.ok) {
        const rolePermissions: Permission[] = await response.json()
        setSelectedPermissionIds(rolePermissions.map((p) => p.id))
      }
    } catch {
      setSelectedPermissionIds([])
    }
  }

  const togglePermission = (permissionId: number) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/roles/${role.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: roleName.trim(),
          permission_ids: selectedPermissionIds,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update role')
      }

      // Success - close modal and refresh
      handleClose()
      if (onSuccess) {
        onSuccess()
      }
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

  // Group permissions by category for better organization
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const category = permission.name.split(':')[0] || 'other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  const permissionCategories = Object.keys(groupedPermissions).sort()

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Role" size="xl">
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
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="e.g., QA Manager, Company Admin"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Permissions
            <span className="ml-2 text-xs font-normal text-gray-500">
              ({selectedPermissionIds.length} selected)
            </span>
          </label>

          {/* Quick Actions */}
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedPermissionIds(permissions.map((p) => p.id))}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={() => setSelectedPermissionIds([])}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear All
            </button>
          </div>

          <div className="max-h-96 space-y-4 overflow-y-auto rounded-md border border-gray-200 p-4">
            {permissions.length === 0 ? (
              <p className="text-sm text-gray-500">Loading permissions...</p>
            ) : (
              permissionCategories.map((category) => (
                <div key={category} className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-800 capitalize">
                    {category}
                  </h4>
                  <div className="ml-4 space-y-2">
                    {groupedPermissions[category].map((permission) => (
                      <label
                        key={permission.id}
                        className="flex items-start space-x-2 rounded-md p-2 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissionIds.includes(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                          className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">
                            {permission.name}
                          </span>
                          {permission.description && (
                            <p className="text-xs text-gray-500">
                              {permission.description}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
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
            {loading ? 'Updating...' : 'Update Role'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
