import { redirect } from 'next/navigation'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { isSystemAdmin } from '@/lib/auth/permissions'
import { isQAManager } from '@/lib/auth/qa-manager'
import { isQAExecutive } from '@/lib/auth/qa-executive'

export default async function Home() {
  const user = await getUserWithRoles()

  if (!user) {
    redirect('/login')
  }

  // Check if user is active
  if (!user.is_active) {
    redirect('/login?error=account_deactivated')
  }

  // Routing:
  // - System admin -> Superadmin Dashboard
  // - QA Manager -> QA Manager Dashboard
  // - QA Executive -> QA Executive Dashboard (my complaints only)
  // - Other company users -> Company Admin Dashboard
  if (isSystemAdmin(user.company_id)) {
    redirect('/dashboard')
  }
  if (isQAManager(user)) {
    redirect(`/qa-manager/${user.company_id}`)
  }
  if (isQAExecutive(user)) {
    redirect(`/qa-executive/${user.company_id}`)
  }
  redirect(`/company-admin/${user.company_id}`)
}
