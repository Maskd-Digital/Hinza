import { UserWithRoles } from '@/types/auth'
import { hasPermission } from '@/lib/auth/permissions'
import { isOperationsManager } from '@/lib/auth/operations-manager'

/** Company admin (permission) or Operations Manager (role) may staff QA Executives to departments. */
export function canManageDepartmentQaAssignments(
  user: UserWithRoles | null | undefined
): boolean {
  if (!user) return false
  return (
    hasPermission(user.permissions, 'department_qa:assign') ||
    isOperationsManager(user)
  )
}
