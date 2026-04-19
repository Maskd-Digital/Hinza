import { UserWithRoles } from '@/types/auth'
import { hasPermission } from '@/lib/auth/permissions'

export const OPERATIONS_MANAGER_ROLE_NAME = 'Operations Manager'

/**
 * Company-wide QA workspace access (all departments).
 * Prefer permission `complaints:read_company_wide`; also match role name for flexibility.
 */
export function isOperationsManager(user: UserWithRoles | null | undefined): boolean {
  if (!user) return false
  if (hasPermission(user.permissions, 'complaints:read_company_wide')) return true
  return user.roles.some(
    (role) => role.name?.trim().toLowerCase() === OPERATIONS_MANAGER_ROLE_NAME.toLowerCase()
  )
}
