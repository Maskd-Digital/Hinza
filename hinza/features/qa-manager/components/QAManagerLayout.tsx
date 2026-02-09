'use client'

import QAManagerSidebar from './QAManagerSidebar'

interface QAManagerLayoutProps {
  children: React.ReactNode
  companyId: string
  companyName: string
}

export default function QAManagerLayout({
  children,
  companyId,
  companyName,
}: QAManagerLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <QAManagerSidebar
        companyId={companyId}
        companyName={companyName}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
