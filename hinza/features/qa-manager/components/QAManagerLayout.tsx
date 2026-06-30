'use client'

import QAManagerSidebar from './QAManagerSidebar'
import type { Permission } from '@/types/auth'

interface QAManagerLayoutProps {
  children: React.ReactNode
  companyId: string
  companyName: string
  roleLabel?: string
  permissions?: Permission[]
}

export default function QAManagerLayout({
  children,
  companyId,
  companyName,
  roleLabel = 'QA Manager',
  permissions = [],
}: QAManagerLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <QAManagerSidebar
        companyId={companyId}
        companyName={companyName}
        roleLabel={roleLabel}
        permissions={permissions}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
