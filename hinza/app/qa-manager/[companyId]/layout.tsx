import { redirect } from 'next/navigation'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { getCompanyById } from '@/lib/api/companies'
import { isQAManager } from '@/lib/auth/qa-manager'
import QAManagerLayout from '@/features/qa-manager/components/QAManagerLayout'

interface QAManagerLayoutProps {
  children: React.ReactNode
  params: Promise<{ companyId: string }>
}

export default async function QAManagerLayoutWrapper({
  children,
  params,
}: QAManagerLayoutProps) {
  const { companyId } = await params
  const user = await getUserWithRoles()

  if (!user) {
    redirect('/login')
  }

  if (!user.is_active) {
    redirect('/login?error=account_deactivated')
  }

  if (!isQAManager(user)) {
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
    <QAManagerLayout companyId={companyId} companyName={company.name}>
      {children}
    </QAManagerLayout>
  )
}
