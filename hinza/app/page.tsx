import { redirect } from 'next/navigation'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { isSystemAdmin } from '@/lib/auth/permissions'

export default async function Home() {
  const user = await getUserWithRoles()

  if (!user) {
    redirect('/login')
  }

  // Check if user is active
  if (!user.is_active) {
    redirect('/login?error=account_deactivated')
  }

  // Routing based on company_id:
  // - Users with SYSTEM_ADMIN_COMPANY_ID are system-level users -> Superadmin Dashboard
  // - Users with any other company_id belong to a specific company -> Company Admin Dashboard
  if (isSystemAdmin(user.company_id)) {
    // System user (superadmin) goes to main dashboard
    redirect('/dashboard')
  } else {
    // Company user goes to their company's admin dashboard
    redirect(`/company-admin/${user.company_id}`)
  }
}
