'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { SYSTEM_ADMIN_COMPANY_ID } from '@/lib/auth/permissions'

export default function LoginPage() {
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

          // Check if user is active
          if (!dbUser.is_active) {
            setError('Your account has been deactivated. Please contact administrator.')
            setLoading(false)
            await supabase.auth.signOut()
            return
          }

          // Redirect based on company_id:
          // - Users with SYSTEM_ADMIN_COMPANY_ID are system-level users -> Superadmin Dashboard
          // - Users with any other company_id belong to a specific company -> Company Admin Dashboard
          if (dbUser.company_id === SYSTEM_ADMIN_COMPANY_ID) {
            // System user (superadmin) goes to main dashboard
            router.push('/dashboard')
          } else {
            // Company user goes to their company's admin dashboard
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
