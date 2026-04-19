'use client'

import FacilityManagerSidebar from './FacilityManagerSidebar'

interface FacilityManagerLayoutProps {
  children: React.ReactNode
  companyId: string
  companyName: string
  /** e.g. "Facility Admin" or "Facility Manager" from the assigned role name */
  roleLabel?: string
}

export default function FacilityManagerLayout({
  children,
  companyId,
  companyName,
  roleLabel = 'Facility Manager',
}: FacilityManagerLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <FacilityManagerSidebar
        companyId={companyId}
        companyName={companyName}
        roleLabel={roleLabel}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
