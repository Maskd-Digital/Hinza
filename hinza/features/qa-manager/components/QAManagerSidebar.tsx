'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NotificationsDropdown from './NotificationsDropdown'

interface QAManagerSidebarProps {
  companyId: string
  companyName: string
  roleLabel?: string
}

export default function QAManagerSidebar({
  companyId,
  companyName,
  roleLabel = 'QA Manager',
}: QAManagerSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const basePath = `/qa-manager/${companyId}`
  const isActive = (path: string) =>
    path === basePath ? pathname === basePath : pathname.startsWith(path)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 flex-shrink-0 border-r border-[#0108B8] bg-[#0108B8]">
      <div className="flex h-full flex-col">
        <div className="border-b border-white/10 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/20 text-white">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-semibold text-white">
                {companyName}
              </h2>
              <p className="text-xs text-white/70">{roleLabel}</p>
            </div>
            <NotificationsDropdown companyId={companyId} />
          </div>
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto p-4">
          <div className="flex flex-col gap-6">
            <Link
              href={basePath}
              className={`flex items-center gap-3 py-2 text-sm font-medium transition-colors ${
                isActive(basePath) && !pathname.includes('/complaints')
                  ? '-ml-4 rounded-r-lg bg-white pl-4 pr-3 text-[#081636] shadow-[inset_0_4px_6px_-1px_rgba(1,8,184,0.25)]'
                  : 'rounded-lg px-3 text-white hover:bg-white/10'
              }`}
            >
              <svg
                className="h-5 w-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Dashboard
            </Link>

            <Link
              href={`${basePath}/complaints`}
              className={`flex items-center gap-3 py-2 text-sm font-medium transition-colors ${
                pathname.includes('/complaints')
                  ? '-ml-4 rounded-r-lg bg-white pl-4 pr-3 text-[#081636] shadow-[inset_0_4px_6px_-1px_rgba(1,8,184,0.25)]'
                  : 'rounded-lg px-3 text-white hover:bg-white/10'
              }`}
            >
              <svg
                className="h-5 w-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              View Complaints
            </Link>
          </div>

          <div className="mt-auto pt-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-[#FF4242] hover:bg-white/10"
            >
              <svg
                className="h-5 w-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </nav>
      </div>
    </aside>
  )
}
