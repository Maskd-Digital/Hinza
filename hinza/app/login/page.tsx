'use client'

import { Suspense, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { SYSTEM_ADMIN_COMPANY_ID } from '@/lib/auth/permissions'
import { isFacilityManager } from '@/lib/auth/facility-manager'
import type { UserWithRoles } from '@/types/auth'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()

  // Check for error query parameter
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'account_inactive' || errorParam === 'account_deactivated') {
      setError('Your account has been deactivated. Please contact administrator.')
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      if (data.user) {
        // Verify user exists in database and fetch their roles
        try {
          const verifyResponse = await fetch('/api/auth/verify-user')
          
          if (!verifyResponse.ok) {
            const errorData = await verifyResponse.json()
            setError(
              errorData.error || 'User account not found. Please contact administrator.'
            )
            setLoading(false)
            // Sign out if user doesn't exist in database
            await supabase.auth.signOut()
            return
          }

          const { user: dbUser } = await verifyResponse.json()
          const sessionUser = dbUser as UserWithRoles

          // Check if user is active
          if (!dbUser.is_active) {
            setError('Your account has been deactivated. Please contact administrator.')
            setLoading(false)
            await supabase.auth.signOut()
            return
          }

          // Redirect: System admin -> dashboard; QA Manager/Executive -> dedicated dashboards; else company admin
          if (dbUser.company_id === SYSTEM_ADMIN_COMPANY_ID) {
            router.push('/dashboard')
          } else if (
            dbUser.roles?.some(
              (r: { name?: string }) =>
                r.name?.toLowerCase() === 'qa manager'
            )
          ) {
            router.push(`/qa-manager/${dbUser.company_id}`)
          } else if (
            dbUser.roles?.some(
              (r: { name?: string }) =>
                r.name?.toLowerCase() === 'qa executive'
            )
          ) {
            router.push(`/qa-executive/${dbUser.company_id}`)
          } else if (isFacilityManager(sessionUser)) {
            router.push(`/facility-manager/${dbUser.company_id}`)
          } else {
            router.push(`/company-admin/${dbUser.company_id}`)
          }
          router.refresh()
        } catch (verifyError) {
          setError('Failed to verify user account. Please try again.')
          setLoading(false)
          await supabase.auth.signOut()
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#EFF4FF' }}>
      <div className="w-full max-w-md space-y-8 rounded-lg p-8" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.35)' }}>
        <div>
          <h2 className="text-center text-3xl font-bold text-[#081636]">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-[#081636]">{error}</p>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#081636]">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-[#081636] shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Enter your email"
                style={{ backgroundColor: '#FFFFFF', boxShadow: 'inset 0 2px 4px rgba(37, 99, 235, 0.25)' }}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#081636]">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-[#081636] shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Enter your password"
                style={{ backgroundColor: '#FFFFFF', boxShadow: 'inset 0 2px 4px rgba(37, 99, 235, 0.25)' }}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: '#0108B8', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#EFF4FF' }}>
      <div className="w-full max-w-md space-y-8 rounded-lg p-8" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.35)' }}>
        <div>
          <h2 className="text-center text-3xl font-bold text-[#081636]">Sign in to your account</h2>
        </div>
        <div className="mt-8 h-10 w-full animate-pulse rounded-md bg-gray-200" />
        <div className="space-y-4">
          <div className="h-12 animate-pulse rounded-md bg-gray-100" />
          <div className="h-12 animate-pulse rounded-md bg-gray-100" />
        </div>
        <div className="h-10 w-full animate-pulse rounded-md bg-blue-100" />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}
