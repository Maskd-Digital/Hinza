'use client'

import { useState, useEffect } from 'react'
import { Permission } from '@/types/auth'

interface Role {
  name: string
  permission_ids: number[]
}

interface Step2CreateRolesProps {
  companyId: string
  initialRoles: Role[]
  onUpdate: (roles: Role[]) => void
  onSkip: () => void
  onNext: () => void
}

export default function Step2CreateRoles({
  companyId,
  initialRoles,
  onUpdate,
  onSkip,
  onNext,
}: Step2CreateRolesProps) {
  const [roles, setRoles] = useState<Role[]>(initialRoles)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Fetch all permissions
    fetch('/api/permissions')
      .then((res) => res.json())
      .then((data) => setPermissions(data))
      .catch(() => setPermissions([]))
  }, [])

  const addRole = () => {
    setRoles([...roles, { name: '', permission_ids: [] }])
  }

  const removeRole = (index: number) => {
    setRoles(roles.filter((_, i) => i !== index))
    onUpdate(roles.filter((_, i) => i !== index))
  }

  const updateRole = (index: number, field: keyof Role, value: any) => {
    const updated = roles.map((role, i) =>
      i === index ? { ...role, [field]: value } : role
    )
    setRoles(updated)
    onUpdate(updated)
  }

  const togglePermission = (roleIndex: number, permissionId: number) => {
    const role = roles[roleIndex]
    const permissionIds = role.permission_ids.includes(permissionId)
      ? role.permission_ids.filter((id) => id !== permissionId)
      : [...role.permission_ids, permissionId]
    updateRole(roleIndex, 'permission_ids', permissionIds)
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-gray-900">
        Step 2: Create Roles (Optional)
      </h2>
      <p className="mb-6 text-sm text-gray-600">
        Define roles for this company and assign permissions. You can skip this
        step and create roles later from the company page.
      </p>

      {roles.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">No roles added yet.</p>
          <button
            type="button"
            onClick={addRole}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Add First Role
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {roles.map((role, roleIndex) => (
            <div
              key={roleIndex}
              className="rounded-lg border border-gray-200 p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Role {roleIndex + 1}
                </h3>
                <button
                  type="button"
                  onClick={() => removeRole(roleIndex)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Role Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={role.name}
                  onChange={(e) =>
                    updateRole(roleIndex, 'name', e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
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
                    <p className="text-sm text-gray-500">Loading permissions...</p>
                  ) : (
                    permissions.map((permission) => (
                      <label
                        key={permission.id}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          checked={role.permission_ids.includes(permission.id)}
                          onChange={() =>
                            togglePermission(roleIndex, permission.id)
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {permission.name}
                        </span>
                        {permission.description && (
                          <span className="text-xs text-gray-500">
                            - {permission.description}
                          </span>
                        )}
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addRole}
            className="w-full rounded-md border border-dashed border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            + Add Another Role
          </button>
        </div>
      )}
    </div>
  )
}
