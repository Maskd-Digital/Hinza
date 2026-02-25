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
        <p className="text-[#081636]">No companies found.</p>
        <Link
          href="/companies/new"
          className="mt-4 inline-block hover:opacity-80"
          style={{ color: '#2563EB' }}
        >
          Create your first company
        </Link>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#081636]">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#081636]">
              Created
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#081636]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {companies.map((company) => (
            <tr key={company.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-[#081636]">
                {company.name}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-[#081636]">
                {new Date(company.created_at).toLocaleDateString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                <Link
                  href={`/companies/${company.id}`}
                  className="hover:opacity-80"
                  style={{ color: '#2563EB' }}
                >
                  View
                </Link>
                <span className="mx-2 text-gray-300">|</span>
                <Link
                  href={`/companies/${company.id}/edit`}
                  className="hover:opacity-80"
                  style={{ color: '#2563EB' }}
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
