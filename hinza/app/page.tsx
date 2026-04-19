import { redirect } from 'next/navigation'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { isSystemAdmin } from '@/lib/auth/permissions'
import { isQAManager } from '@/lib/auth/qa-manager'
import { isOperationsManager } from '@/lib/auth/operations-manager'
import { isQAExecutive } from '@/lib/auth/qa-executive'
import { isFacilityManager } from '@/lib/auth/facility-manager'
import LandingHero from '@/components/LandingHero'

export default async function Home() {
  const user = await getUserWithRoles()

  // If not authenticated, show public landing page
  if (!user) {
    return <LandingHero />
  }

  // Check if user is active
  if (!user.is_active) {
    redirect('/login?error=account_deactivated')
  }

  // Routing:
  // - System admin -> Superadmin Dashboard
  // - QA Manager -> QA Manager Dashboard
  // - QA Executive -> QA Executive Dashboard (my complaints only)
  // - Facility Manager -> Facility Manager Dashboard
  // - Other company users -> Company Admin Dashboard
  if (isSystemAdmin(user.company_id)) {
    redirect('/dashboard')
  }
  if (isOperationsManager(user)) {
    redirect(`/qa-manager/${user.company_id}`)
  }
  if (isQAManager(user)) {
    redirect(`/qa-manager/${user.company_id}`)
  }
  if (isQAExecutive(user)) {
    redirect(`/qa-executive/${user.company_id}`)
  }
  if (isFacilityManager(user)) {
    redirect(`/facility-manager/${user.company_id}`)
  }
  redirect(`/company-admin/${user.company_id}`)
}

