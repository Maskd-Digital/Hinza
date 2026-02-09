import { redirect } from 'next/navigation'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { getCompanyById } from '@/lib/api/companies'
import { isQAExecutive } from '@/lib/auth/qa-executive'
import QAExecutiveLayout from '@/features/qa-executive/components/QAExecutiveLayout'

interface QAExecutiveLayoutProps {
  children: React.ReactNode
  params: Promise<{ companyId: string }>
}

export default async function QAExecutiveLayoutWrapper({
  children,
  params,
}: QAExecutiveLayoutProps) {
  const { companyId } = await params
  const user = await getUserWithRoles()

  if (!user) {
    redirect('/login')
  }

  if (!user.is_active) {
    redirect('/login?error=account_deactivated')
  }

  if (!isQAExecutive(user)) {
    redirect('/unauthorized')
  }

  if (user.company_id !== companyId) {
    redirect('/unauthorized')
  }

  let company
  try {
    company = await getCompanyById(companyId)
  } catch {
    redirect('/unauthorized')
  }

  if (!company) {
    redirect('/unauthorized')
  }

  return (
    <QAExecutiveLayout companyId={companyId} companyName={company.name}>
      {children}
    </QAExecutiveLayout>
  )
}
