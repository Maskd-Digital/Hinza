import { UserWithRoles } from '@/types/auth'

/** Role name that identifies QA Executive (case-insensitive match). */
export const QA_EXECUTIVE_ROLE_NAME = 'QA Executive'

/**
 * Returns true if the user has the QA Executive role (by role name).
 * QA Executives see only complaints assigned to them; they cannot assign to others.
 */
export function isQAExecutive(user: UserWithRoles | null | undefined): boolean {
  if (!user?.roles?.length) return false
  return user.roles.some(
    (role) => role.name?.toLowerCase() === QA_EXECUTIVE_ROLE_NAME.toLowerCase()
  )
}
