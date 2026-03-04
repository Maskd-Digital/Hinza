'use client'

import { useState, useEffect } from 'react'
import { Role } from '@/types/auth'
import EditRoleModal from '@/features/companies/components/EditRoleModal'
import ViewUsersByRoleModal from './ViewUsersByRoleModal'
import BulkAddUsersModal from './BulkAddUsersModal'

interface RoleWithPermissions extends Role {
  permissions: Array<{
    id: number
    name: string
    description: string | null
  }>
}

interface ManageRolesPageProps {
  companyId: string
  canUpdateRoles: boolean
  canBulkAssignUsers: boolean
}

export default function ManageRolesPage({
  companyId,
  canUpdateRoles,
  canBulkAssignUsers,
}: ManageRolesPageProps) {
  const [roles, setRoles] = useState<RoleWithPermissions[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [viewUsersRole, setViewUsersRole] = useState<Role | null>(null)
  const [bulkAddRole, setBulkAddRole] = useState<Role | null>(null)

  const fetchRoles = async () => {
    setLoading(true)
    setError(null)
    try {
      const rolesRes = await fetch(`/api/roles?company_id=${companyId}`)
      if (!rolesRes.ok) throw new Error('Failed to fetch roles')
      const rolesData: Role[] = await rolesRes.json()

      const withPermissions = await Promise.all(
        rolesData.map(async (role) => {
          try {
            const permRes = await fetch(`/api/permissions?role_id=${role.id}`)
            const permissions = permRes.ok ? await permRes.json() : []
            return { ...role, permissions }
          } catch {
            return { ...role, permissions: [] }
          }
        })
      )
      setRoles(withPermissions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [companyId])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#081636]">Manage Roles</h1>
        <p className="mt-1 text-sm text-gray-600">
          View and edit role permissions, see users per role, and bulk add users to roles.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-[#081636]">Loading roles...</div>
      ) : roles.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-[#081636]">
          No roles found for this company.
        </div>
      ) : (
        <div className="space-y-4">
          {roles.map((role) => (
            <div
              key={role.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-[#081636]">
                    {role.name}
                  </h2>
                  <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-800">
                    {role.permissions.length} permission
                    {role.permissions.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {canUpdateRoles && (
                    <button
                      type="button"
                      onClick={() => setEditingRole(role)}
                      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-[#081636] hover:bg-gray-50"
                    >
                      Edit permissions
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setViewUsersRole(role)}
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-[#081636] hover:bg-gray-50"
                  >
                    View users
                  </button>
                  {canBulkAssignUsers && (
                    <button
                      type="button"
                      onClick={() => setBulkAddRole(role)}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Bulk add users
                    </button>
                  )}
                </div>
              </div>
              {role.permissions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {role.permissions.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-[#081636]"
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editingRole && (
        <EditRoleModal
          isOpen={!!editingRole}
          onClose={() => setEditingRole(null)}
          role={editingRole}
          companyId={companyId}
          onSuccess={fetchRoles}
        />
      )}

      <ViewUsersByRoleModal
        isOpen={!!viewUsersRole}
        onClose={() => setViewUsersRole(null)}
        role={viewUsersRole}
        companyId={companyId}
      />

      {bulkAddRole !== null && (
        <BulkAddUsersModal
          isOpen={true}
          onClose={() => setBulkAddRole(null)}
          role={bulkAddRole}
          companyId={companyId}
          roles={roles}
          onSuccess={fetchRoles}
        />
      )}
    </div>
  )
}
