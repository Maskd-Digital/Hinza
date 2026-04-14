'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface FacilityManagerSidebarProps {
  companyId: string
  companyName: string
}

export default function FacilityManagerSidebar({
  companyId,
  companyName,
}: FacilityManagerSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const basePath = `/facility-manager/${companyId}`

  const isActive = (path: string) =>
    path === basePath ? pathname === basePath : pathname.startsWith(path)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 flex-shrink-0 border-r border-[#0f766e] bg-[#0f766e]">
      <div className="flex h-full flex-col">
        <div className="border-b border-white/10 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/20 text-white">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-semibold text-white">{companyName}</h2>
              <p className="text-xs text-white/70">Facility Manager</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto p-4">
          <div className="flex flex-col gap-6">
            <Link
              href={basePath}
              className={`flex items-center gap-3 py-2 text-sm font-medium transition-colors ${
                isActive(basePath) && !pathname.includes('/complaints')
                  ? '-ml-4 rounded-r-lg bg-white pl-4 pr-3 text-[#081636] shadow-[inset_0_4px_6px_-1px_rgba(15,118,110,0.25)]'
                  : 'rounded-lg px-3 text-white hover:bg-white/10'
              }`}
            >
              <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  ? '-ml-4 rounded-r-lg bg-white pl-4 pr-3 text-[#081636] shadow-[inset_0_4px_6px_-1px_rgba(15,118,110,0.25)]'
                  : 'rounded-lg px-3 text-white hover:bg-white/10'
              }`}
            >
              <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Equipment complaints
            </Link>
          </div>

          <div className="mt-auto pt-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-[#fecaca] hover:bg-white/10"
            >
              <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
