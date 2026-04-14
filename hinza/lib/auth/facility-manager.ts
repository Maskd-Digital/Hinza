import { UserWithRoles } from '@/types/auth'

/** Role name that identifies Facility Manager (case-insensitive match). */
export const FACILITY_MANAGER_ROLE_NAME = 'Facility Manager'

export function isFacilityManager(user: UserWithRoles | null | undefined): boolean {
  if (!user?.roles?.length) return false
  return user.roles.some(
    (role) => role.name?.toLowerCase() === FACILITY_MANAGER_ROLE_NAME.toLowerCase()
  )
}
