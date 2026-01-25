'use client'

import { UserWithRoles } from '@/types/auth'
import Link from 'next/link'

interface UsersListProps {
  users: UserWithRoles[]
}

export default function UsersList({ users }: UsersListProps) {
  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-500">No users found.</p>
        <Link
          href="/users/new"
          className="mt-4 inline-block text-blue-600 hover:text-blue-700"
        >
          Create your first superadmin
        </Link>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Name
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                {user.email}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                <div className="flex flex-wrap gap-1">
                  {user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <span
                        key={role.id}
                        className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold text-blue-800"
                      >
                        {role.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400">No roles</span>
                  )}
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                <span
                  className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                    user.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {user.full_name || 'N/A'}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                <Link
                  href={`/users/${user.id}`}
                  className="text-blue-600 hover:text-blue-900"
                >
                  View
                </Link>
                <span className="mx-2 text-gray-300">|</span>
                <Link
                  href={`/users/${user.id}/edit`}
                  className="text-blue-600 hover:text-blue-900"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
