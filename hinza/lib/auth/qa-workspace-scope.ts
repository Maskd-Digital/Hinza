import { UserWithRoles } from '@/types/auth'
import { isQAExecutive } from '@/lib/auth/qa-executive'
import { isOperationsManager } from '@/lib/auth/operations-manager'

/**
 * QA Executives without Operations Manager company-wide access are scoped by
 * department assignments. QA Managers are company-wide triage owners and are
 * not department-scoped.
 */
export function isDepartmentScopedQaExecutive(
  user: UserWithRoles | null | undefined
): boolean {
  if (!user) return false
  if (isOperationsManager(user)) return false
  return isQAExecutive(user)
}

/** @deprecated Use isDepartmentScopedQaExecutive — QA Managers are company-wide. */
export function isDepartmentScopedQaWorkspaceUser(
  user: UserWithRoles | null | undefined
): boolean {
  return isDepartmentScopedQaExecutive(user)
}
