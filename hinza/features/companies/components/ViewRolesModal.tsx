'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/Modal'
import { Role } from '@/types/auth'
import EditRoleModal from './EditRoleModal'

interface ViewRolesModalProps {
  isOpen: boolean
  onClose: () => void
  companyId: string
}

interface RoleWithPermissions extends Role {
  permissions: Array<{
    id: number
    name: string
    description: string | null
  }>
}

export default function ViewRolesModal({
  isOpen,
  onClose,
  companyId,
}: ViewRolesModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [roles, setRoles] = useState<RoleWithPermissions[]>([])
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    if (isOpen && companyId) {
      fetchRoles()
    }
  }, [isOpen, companyId])

  const fetchRoles = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch roles
      const rolesResponse = await fetch(`/api/roles?company_id=${companyId}`)
      if (!rolesResponse.ok) {
        throw new Error('Failed to fetch roles')
      }
      const rolesData: Role[] = await rolesResponse.json()

      // Fetch permissions for each role
      const rolesWithPermissions = await Promise.all(
        rolesData.map(async (role) => {
          try {
            const permissionsResponse = await fetch(
              `/api/permissions?role_id=${role.id}`
            )
            if (permissionsResponse.ok) {
              const permissions = await permissionsResponse.json()
              return { ...role, permissions }
            }
            return { ...role, permissions: [] }
          } catch {
            return { ...role, permissions: [] }
          }
        })
      )

      setRoles(rolesWithPermissions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Company Roles" size="xl">
      <div className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-[#081636]">Loading roles...</div>
        ) : roles.length === 0 ? (
          <div className="py-8 text-center text-[#081636]">
            No roles found for this company.
          </div>
        ) : (
          <div className="space-y-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#081636]">
                    {role.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                      {role.permissions.length} permission
                      {role.permissions.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={() => {
                        setEditingRole(role)
                        setIsEditModalOpen(true)
                      }}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {role.permissions.length > 0 ? (
                  <div className="mt-3">
                    <p className="mb-2 text-sm font-medium text-[#081636]">
                      Permissions:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map((permission) => (
                        <span
                          key={permission.id}
                          className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-[#081636]"
                        >
                          {permission.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[#081636]">No permissions assigned</p>
                )}
              </div>
            ))}
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

      {/* Edit Role Modal */}
      {editingRole && (
        <EditRoleModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingRole(null)
          }}
          role={editingRole}
          companyId={companyId}
          onSuccess={() => {
            // Refresh roles list after successful edit
            fetchRoles()
          }}
        />
      )}
    </Modal>
  )
}
