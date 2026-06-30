import { redirect } from 'next/navigation'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { getCompanyById } from '@/lib/api/companies'
import { isOperationsManager } from '@/lib/auth/operations-manager'
import { canManageDepartmentQaAssignments } from '@/lib/auth/department-qa-assign'
import DepartmentQaAssignmentsPage from '@/features/company-admin/components/DepartmentQaAssignmentsPage'

interface PageProps {
  params: Promise<{ companyId: string }>
}

export default async function OperationsManagerDepartmentQaPage({ params }: PageProps) {
  const { companyId } = await params
  const user = await getUserWithRoles()

  if (!user) redirect('/login')
  if (!user.is_active) redirect('/login?error=account_deactivated')

  if (!isOperationsManager(user) || user.company_id !== companyId) {
    redirect('/unauthorized')
  }

  if (!canManageDepartmentQaAssignments(user)) {
    redirect('/unauthorized')
  }

  const company = await getCompanyById(companyId)
  if (!company) redirect('/unauthorized')

  return (
    <div className="p-6">
      <DepartmentQaAssignmentsPage
        companyId={companyId}
        companyName={company.name}
        userPermissions={user.permissions}
        canAssign
      />
    </div>
  )
}
