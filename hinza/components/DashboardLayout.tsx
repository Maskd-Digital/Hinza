import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import { Permission } from '@/types/auth'

interface DashboardLayoutProps {
  children: ReactNode
  permissions: Permission[]
}

export default function DashboardLayout({
  children,
  permissions,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar permissions={permissions} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
