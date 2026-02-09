'use client'

import QAExecutiveSidebar from './QAExecutiveSidebar'

interface QAExecutiveLayoutProps {
  children: React.ReactNode
  companyId: string
  companyName: string
}

export default function QAExecutiveLayout({
  children,
  companyId,
  companyName,
}: QAExecutiveLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <QAExecutiveSidebar companyId={companyId} companyName={companyName} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
