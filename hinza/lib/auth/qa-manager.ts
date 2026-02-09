import { UserWithRoles } from '@/types/auth'

/** Role name that identifies QA Manager (case-insensitive match). */
export const QA_MANAGER_ROLE_NAME = 'QA Manager'

/**
 * Returns true if the user has the QA Manager role (by role name).
 * QA Managers get the dedicated QA dashboard; they do not see users, products, or facilities.
 */
export function isQAManager(user: UserWithRoles | null | undefined): boolean {
  if (!user?.roles?.length) return false
  return user.roles.some(
    (role) => role.name?.toLowerCase() === QA_MANAGER_ROLE_NAME.toLowerCase()
  )
}
