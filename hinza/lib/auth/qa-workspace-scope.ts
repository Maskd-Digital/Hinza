import { UserWithRoles } from '@/types/auth'
import { isQAManager } from '@/lib/auth/qa-manager'
import { isQAExecutive } from '@/lib/auth/qa-executive'
import { isOperationsManager } from '@/lib/auth/operations-manager'

/** QA Manager or QA Executive without Operations Manager company-wide access — scoped by department assignments. */
export function isDepartmentScopedQaWorkspaceUser(
  user: UserWithRoles | null | undefined
): boolean {
  if (!user) return false
  if (isOperationsManager(user)) return false
  return isQAManager(user) || isQAExecutive(user)
}
