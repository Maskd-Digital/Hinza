'use client'

import QAManagerSidebar from './QAManagerSidebar'
import type { Permission } from '@/types/auth'

interface QAManagerLayoutProps {
  children: React.ReactNode
  companyId: string
  companyName: string
  roleLabel?: string
  permissions?: Permission[]
  isOperationsManager?: boolean
}

export default function QAManagerLayout({
  children,
  companyId,
  companyName,
  roleLabel = 'QA Manager',
  permissions = [],
  isOperationsManager = false,
}: QAManagerLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <QAManagerSidebar
        companyId={companyId}
        companyName={companyName}
        roleLabel={roleLabel}
        permissions={permissions}
        isOperationsManager={isOperationsManager}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
