'use client'

import { CompanyStats } from '@/lib/api/companies'

interface CompanyStatsCardsProps {
  stats: CompanyStats
  companyId: string
  onViewRoles?: () => void
  onViewProducts?: () => void
  onViewTemplates?: () => void
  onViewComplaints?: () => void
  onViewFacilities?: () => void
}

export default function CompanyStatsCards({
  stats,
  companyId,
  onViewRoles,
  onViewProducts,
  onViewTemplates,
  onViewComplaints,
  onViewFacilities,
}: CompanyStatsCardsProps) {
  const statCards = [
    {
      title: 'Roles',
      count: stats.rolesCount,
      icon: (
        <svg
          className="h-8 w-8 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      onClick: onViewRoles,
      color: 'blue',
    },
    {
      title: 'Products',
      count: stats.productsCount,
      icon: (
        <svg
          className="h-8 w-8 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
      onClick: onViewProducts,
      color: 'green',
    },
    {
      title: 'Complaints',
      count: stats.complaintsCount,
      icon: (
        <svg
          className="h-8 w-8 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      onClick: onViewComplaints,
      color: 'red',
    },
    {
      title: 'Templates',
      count: stats.templatesCount,
      icon: (
        <svg
          className="h-8 w-8 text-purple-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      onClick: onViewTemplates,
      color: 'purple',
    },
    {
      title: 'Facilities',
      count: stats.facilitiesCount,
      icon: (
        <svg
          className="h-8 w-8 text-orange-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
      onClick: onViewFacilities,
      color: 'orange',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {statCards.map((stat) => {
        const CardContent = (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stat.count}
                </p>
              </div>
              <div className="rounded-full bg-gray-50 p-3 group-hover:bg-gray-100">
                {stat.icon}
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <span>View all</span>
              <svg
                className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </>
        )

        if (stat.onClick) {
          return (
            <button
              key={stat.title}
              onClick={stat.onClick}
              className="group w-full rounded-lg border border-gray-200 bg-white p-6 text-left shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {CardContent}
            </button>
          )
        }

        return (
          <div
            key={stat.title}
            className="group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            {CardContent}
          </div>
        )
      })}
    </div>
  )
}
