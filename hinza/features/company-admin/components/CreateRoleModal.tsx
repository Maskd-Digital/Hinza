'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Permission } from '@/types/auth'
import Modal from '@/components/Modal'

interface CreateRoleModalProps {
  isOpen: boolean
  onClose: () => void
  companyId: string
  onSuccess?: () => void
}

export default function CreateRoleModal({
  isOpen,
  onClose,
  companyId,
  onSuccess,
}: CreateRoleModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [roleName, setRoleName] = useState('')
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([])

  useEffect(() => {
    if (!isOpen) return
    setRoleName('')
    setSelectedPermissionIds([])
    setError(null)
    ;(async () => {
      try {
        const response = await fetch('/api/permissions')
        if (response.ok) {
          const data = await response.json()
          setPermissions(Array.isArray(data) ? data : [])
        } else {
          setPermissions([])
        }
      } catch {
        setPermissions([])
      }
    })()
  }, [isOpen])

  const groupedPermissions = useMemo(() => {
    return permissions.reduce(
      (acc, permission) => {
        const category = permission.name.split(':')[0] || 'other'
        if (!acc[category]) acc[category] = []
        acc[category].push(permission)
        return acc
      },
      {} as Record<string, Permission[]>
    )
  }, [permissions])

  const permissionCategories = Object.keys(groupedPermissions).sort()

  const togglePermission = (permissionId: number) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = roleName.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmed,
          company_id: companyId,
          permission_ids: selectedPermissionIds,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create role')
      }

      handleClose()
      onSuccess?.()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Create role" size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[#081636]">
            Role name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-[#081636] shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="e.g. Facility Manager, Auditor"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#081636]">
            Permissions
            <span className="ml-2 text-xs font-normal text-gray-600">
              ({selectedPermissionIds.length} selected)
            </span>
          </label>

          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedPermissionIds(permissions.map((p) => p.id))}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-[#081636] hover:bg-gray-50"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={() => setSelectedPermissionIds([])}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-[#081636] hover:bg-gray-50"
            >
              Clear all
            </button>
          </div>

          <div className="max-h-96 space-y-4 overflow-y-auto rounded-md border border-gray-200 p-4">
            {permissions.length === 0 ? (
              <p className="text-sm text-gray-600">Loading permissions…</p>
            ) : (
              permissionCategories.map((category) => (
                <div key={category} className="space-y-2">
                  <h4 className="text-sm font-semibold capitalize text-[#081636]">{category}</h4>
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
                          <span className="text-sm font-medium text-[#081636]">{permission.name}</span>
                          {permission.description && (
                            <p className="text-xs text-gray-600">{permission.description}</p>
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
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-[#081636] hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !roleName.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create role'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
