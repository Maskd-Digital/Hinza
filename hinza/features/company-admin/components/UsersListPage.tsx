'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import InviteUserModal from './InviteUserModal'

interface User {
  id: string
  full_name: string | null
  email: string | null
  is_active: boolean
  roles?: Array<{ id: string; name: string }>
}

interface UsersListPageProps {
  companyId: string
  canCreateUsers: boolean
  canDeleteUsers: boolean
}

export default function UsersListPage({
  companyId,
  canCreateUsers,
  canDeleteUsers,
}: UsersListPageProps) {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [companyId])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/users?company_id=${companyId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery === '' ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'inactive' && !user.is_active)

    return matchesSearch && matchesStatus
  })

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update user status')
      }

      fetchUsers()
    } catch (err) {
      console.error('Error updating user:', err)
    }
  }

  const handleDeleteUser = async (userId: string, userLabel: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${userLabel}? This will deactivate the account and remove role assignments.`
    )
    if (!confirmed) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      fetchUsers()
    } catch (err) {
      console.error('Error deleting user:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#081636]">Users</h1>
          <p className="text-sm text-[#081636]">
            Manage users and their access
          </p>
        </div>
        {canCreateUsers && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: '#0108B8', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            Add User
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm text-[#081636] placeholder:text-[#081636] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            style={{ backgroundColor: '#FFFFFF', boxShadow: 'inset 0 2px 4px rgba(1, 8, 184, 0.25)' }}
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
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'text-white'
                  : 'text-gray-700 hover:opacity-90'
              }`}
              style={
                filterStatus === status
                  ? { backgroundColor: '#0108B8', boxShadow: 'inset 0 2px 4px rgba(8, 22, 54, 0.25)' }
                  : { backgroundColor: '#FFFFFF', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }
              }
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
          <p className="text-sm text-[#081636]">Total Users</p>
          <p className="mt-1 text-2xl font-bold text-[#081636]">{users.length}</p>
        </div>
        <div className="rounded-xl bg-white p-4" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
          <p className="text-sm text-[#081636]">Active Users</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {users.filter((u) => u.is_active).length}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
          <p className="text-sm text-[#081636]">Inactive Users</p>
          <p className="mt-1 text-2xl font-bold text-red-600">
            {users.filter((u) => !u.is_active).length}
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl overflow-hidden bg-white" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="rounded-lg bg-red-50 p-4" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="mt-2 text-sm text-[#081636]">
              {searchQuery || filterStatus !== 'all'
                ? 'No users match your filters'
                : 'No users found'}
            </p>
            {canCreateUsers && !searchQuery && filterStatus === 'all' && (
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                style={{ backgroundColor: '#0108B8', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}
              >
                Add your first user
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#081636]">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#081636]">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#081636]">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#081636]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                          {(user.full_name || user.email || 'U')
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#081636]">
                            {user.full_name || 'No name'}
                          </p>
                          <p className="text-sm text-[#081636]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <span
                              key={role.id}
                              className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                            >
                              {role.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400 italic">
                            No roles assigned
                          </span>
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
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            user.is_active ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            handleToggleStatus(user.id, user.is_active)
                          }
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            user.is_active
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        {canDeleteUsers && (
                          <button
                            onClick={() =>
                              handleDeleteUser(
                                user.id,
                                user.full_name || user.email || 'this user'
                              )
                            }
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 text-sm text-[#081636]">
        Showing {filteredUsers.length} of {users.length} users
      </div>

      {/* Invite Modal */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        companyId={companyId}
        onSuccess={() => {
          setIsInviteModalOpen(false)
          fetchUsers()
          router.refresh()
        }}
      />
    </div>
  )
}
