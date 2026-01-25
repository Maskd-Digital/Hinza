'use client'

import { Company } from '@/types/company'
import Link from 'next/link'

interface CompaniesListProps {
  companies: Company[]
}

export default function CompaniesList({ companies }: CompaniesListProps) {
  if (companies.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-500">No companies found.</p>
        <Link
          href="/companies/new"
          className="mt-4 inline-block text-blue-600 hover:text-blue-700"
        >
          Create your first company
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
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Created
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {companies.map((company) => (
            <tr key={company.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                {company.name}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {new Date(company.created_at).toLocaleDateString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                <Link
                  href={`/companies/${company.id}`}
                  className="text-blue-600 hover:text-blue-900"
                >
                  View
                </Link>
                <span className="mx-2 text-gray-300">|</span>
                <Link
                  href={`/companies/${company.id}/edit`}
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
