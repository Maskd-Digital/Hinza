'use client'

import FacilityManagerSidebar from './FacilityManagerSidebar'

interface FacilityManagerLayoutProps {
  children: React.ReactNode
  companyId: string
  companyName: string
}

export default function FacilityManagerLayout({
  children,
  companyId,
  companyName,
}: FacilityManagerLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <FacilityManagerSidebar companyId={companyId} companyName={companyName} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
