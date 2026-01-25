'use client'

import { Permission } from '@/types/auth'
import CompanyAdminSidebar from './CompanyAdminSidebar'

interface CompanyAdminLayoutProps {
  children: React.ReactNode
  permissions: Permission[]
  companyId: string
  companyName: string
}

export default function CompanyAdminLayout({
  children,
  permissions,
  companyId,
  companyName,
}: CompanyAdminLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <CompanyAdminSidebar
        permissions={permissions}
        companyId={companyId}
        companyName={companyName}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
