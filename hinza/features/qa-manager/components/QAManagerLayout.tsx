'use client'

import QAManagerSidebar from './QAManagerSidebar'

interface QAManagerLayoutProps {
  children: React.ReactNode
  companyId: string
  companyName: string
  roleLabel?: string
}

export default function QAManagerLayout({
  children,
  companyId,
  companyName,
  roleLabel = 'QA Manager',
}: QAManagerLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <QAManagerSidebar
        companyId={companyId}
        companyName={companyName}
        roleLabel={roleLabel}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
