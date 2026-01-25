'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserWithRoles, Role } from '@/types/auth'
import EditRoleModal from '@/features/companies/components/EditRoleModal'

interface SuperadminUsersListProps {
  initialUsers: UserWithRoles[]
}

interface RoleWithCompany extends Role {
  company_name?: string
}

export default function SuperadminUsersList({ initialUsers }: SuperadminUsersListProps) {
  const router = useRouter()
  const [users, setUsers] = useState<UserWithRoles[]>(initialUsers)
  const [roles, setRoles] = useState<RoleWithCompany[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true)
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCompany, setFilterCompany] = useState<string>('all')
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])
  
  // Edit role modal state
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  useEffect(() => {
    fetchRoles()
    fetchCompanies()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true)
      const response = await fetch('/api/roles')
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      }
    } catch {
      console.error('Failed to fetch roles')
    } finally {
      setLoadingRoles(false)
    }
  }

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      if (response.ok) {
        const data = await response.json()
        setCompanies(data)
      }
    } catch {
      console.error('Failed to fetch companies')
    }
  }

  const handleEditRole = (role: Role) => {
    setSelectedRole(role)
    setIsEditRoleModalOpen(true)
  }

  const handleRoleUpdated = () => {
    fetchRoles()
    router.refresh()
  }

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      })
      
      if (response.ok) {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, is_active: !currentStatus } : u
        ))
        router.refresh()
      }
    } catch {
      console.error('Failed to update user status')
    }
  }

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery === '' ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCompany =
      filterCompany === 'all' || user.company_id === filterCompany

    return matchesSearch && matchesCompany
  })

  // Filter roles
  const filteredRoles = roles.filter((role) => {
    const matchesSearch =
      searchQuery === '' ||
      role.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCompany =
      filterCompany === 'all' || role.company_id === filterCompany

    return matchesSearch && matchesCompany
  })

  // Get company name helper
  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    return company?.name || 'Unknown Company'
  }

  // Check if role is superadmin (no company_id or special name)
  const isSuperadminRole = (role: Role) => {
    return !role.company_id || role.name.toLowerCase() === 'superadmin'
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === 'roles'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Roles ({roles.length})
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder={activeTab === 'users' ? 'Search users...' : 'Search roles...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Company:</label>
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Companies</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Tab Content */}
      {activeTab === 'users' && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No users found.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                          {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.full_name || 'No name'}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {user.company_id ? getCompanyName(user.company_id) : (
                        <span className="text-purple-600 font-medium">System Admin</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <button
                              key={role.id}
                              onClick={() => !isSuperadminRole(role) && handleEditRole(role)}
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                                isSuperadminRole(role)
                                  ? 'bg-purple-100 text-purple-800 cursor-default'
                                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer'
                              }`}
                              title={isSuperadminRole(role) ? 'Superadmin role cannot be edited' : 'Click to edit role permissions'}
                            >
                              {role.name}
                              {!isSuperadminRole(role) && (
                                <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              )}
                            </button>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">No roles</span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          user.is_active
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Roles Tab Content */}
      {activeTab === 'roles' && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
          {loadingRoles ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No roles found.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Role Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredRoles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          isSuperadminRole(role) ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{role.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {role.company_id ? getCompanyName(role.company_id) : (
                        <span className="text-purple-600 font-medium">System</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        isSuperadminRole(role)
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {isSuperadminRole(role) ? 'System Role' : 'Company Role'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      {isSuperadminRole(role) ? (
                        <span className="text-xs text-gray-400">Protected</span>
                      ) : (
                        <button
                          onClick={() => handleEditRole(role)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Edit Permissions
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="text-sm text-gray-500">
        {activeTab === 'users' 
          ? `Showing ${filteredUsers.length} of ${users.length} users`
          : `Showing ${filteredRoles.length} of ${roles.length} roles`
        }
      </div>

      {/* Edit Role Modal */}
      <EditRoleModal
        isOpen={isEditRoleModalOpen}
        onClose={() => {
          setIsEditRoleModalOpen(false)
          setSelectedRole(null)
        }}
        role={selectedRole}
        companyId={selectedRole?.company_id || ''}
        onSuccess={handleRoleUpdated}
      />
    </div>
  )
}
