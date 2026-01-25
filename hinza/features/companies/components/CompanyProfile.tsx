'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Company } from '@/types/company'
import { Permission } from '@/types/auth'
import { CompanyStats } from '@/lib/api/companies'
import { hasPermission } from '@/lib/auth/permissions'
import ComplaintsTimeline from './ComplaintsTimeline'
import CompanyStatsCards from './CompanyStatsCards'
import AddRoleModal from './AddRoleModal'
import AddTemplateModal from './AddTemplateModal'
import AddProductModal from './AddProductModal'
import AddFacilityModal from './AddFacilityModal'
import ViewRolesModal from './ViewRolesModal'
import ViewProductsModal from './ViewProductsModal'
import ViewTemplatesModal from './ViewTemplatesModal'
import ViewComplaintsModal from './ViewComplaintsModal'
import ViewFacilitiesModal from './ViewFacilitiesModal'

interface CompanyProfileProps {
  company: Company
  stats: CompanyStats
  userPermissions: Permission[]
}

export default function CompanyProfile({
  company,
  stats,
  userPermissions,
}: CompanyProfileProps) {
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false)
  const [isViewRolesModalOpen, setIsViewRolesModalOpen] = useState(false)
  const [isViewProductsModalOpen, setIsViewProductsModalOpen] = useState(false)
  const [isViewTemplatesModalOpen, setIsViewTemplatesModalOpen] = useState(false)
  const [isViewComplaintsModalOpen, setIsViewComplaintsModalOpen] = useState(false)
  const [isViewFacilitiesModalOpen, setIsViewFacilitiesModalOpen] = useState(false)

  const canCreateProducts = hasPermission(
    userPermissions,
    'products:create'
  )
  const canCreateTemplates = hasPermission(
    userPermissions,
    'templates:create'
  )
  const canCreateRoles = hasPermission(userPermissions, 'roles:create')
  const canCreateFacilities = hasPermission(userPermissions, 'facilities:create')
  const canViewCompany = hasPermission(userPermissions, 'companies:read')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner Image */}
      <div className="relative h-64 w-full bg-gradient-to-r from-blue-500 to-blue-700">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold">{company.name}</h1>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Action Buttons Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-3">
            {canCreateProducts && (
              <button
                onClick={() => setIsProductModalOpen(true)}
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Product(s)
              </button>
            )}

            {canCreateTemplates && (
              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Complaint Template
              </button>
            )}

            {canCreateRoles && (
              <button
                onClick={() => setIsRoleModalOpen(true)}
                className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Role
              </button>
            )}

            {canCreateFacilities && (
              <button
                onClick={() => setIsFacilityModalOpen(true)}
                className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Facility
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Created on{' '}
              {new Date(company.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <Link
              href={`/company-admin/${company.id}`}
              className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Admin Dashboard
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <CompanyStatsCards
          stats={stats}
          companyId={company.id}
          onViewRoles={canViewCompany ? () => setIsViewRolesModalOpen(true) : undefined}
          onViewProducts={canViewCompany ? () => setIsViewProductsModalOpen(true) : undefined}
          onViewTemplates={canViewCompany ? () => setIsViewTemplatesModalOpen(true) : undefined}
          onViewComplaints={canViewCompany ? () => setIsViewComplaintsModalOpen(true) : undefined}
          onViewFacilities={canViewCompany ? () => setIsViewFacilitiesModalOpen(true) : undefined}
        />

        {/* Timeline Graph */}
        <div className="mt-6 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Complaints Timeline (Last 30 Days)
          </h2>
          <ComplaintsTimeline data={stats.complaintsTimeline} />
        </div>
      </div>

      {/* Modals */}
      {canCreateRoles && (
        <AddRoleModal
          isOpen={isRoleModalOpen}
          onClose={() => setIsRoleModalOpen(false)}
          companyId={company.id}
        />
      )}

      {canCreateTemplates && (
        <AddTemplateModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          companyId={company.id}
        />
      )}

      {canCreateProducts && (
        <AddProductModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          companyId={company.id}
        />
      )}

      {canCreateFacilities && (
        <AddFacilityModal
          isOpen={isFacilityModalOpen}
          onClose={() => setIsFacilityModalOpen(false)}
          companyId={company.id}
        />
      )}

      {/* View Modals */}
      {canViewCompany && (
        <>
          <ViewRolesModal
            isOpen={isViewRolesModalOpen}
            onClose={() => setIsViewRolesModalOpen(false)}
            companyId={company.id}
          />
          <ViewProductsModal
            isOpen={isViewProductsModalOpen}
            onClose={() => setIsViewProductsModalOpen(false)}
            companyId={company.id}
          />
          <ViewTemplatesModal
            isOpen={isViewTemplatesModalOpen}
            onClose={() => setIsViewTemplatesModalOpen(false)}
            companyId={company.id}
          />
          <ViewComplaintsModal
            isOpen={isViewComplaintsModalOpen}
            onClose={() => setIsViewComplaintsModalOpen(false)}
            companyId={company.id}
          />
          <ViewFacilitiesModal
            isOpen={isViewFacilitiesModalOpen}
            onClose={() => setIsViewFacilitiesModalOpen(false)}
            companyId={company.id}
            companyName={company.name}
          />
        </>
      )}
    </div>
  )
}
