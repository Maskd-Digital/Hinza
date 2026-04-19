import { UserWithRoles } from '@/types/auth'

/** Role names for users who use the facility-scoped dashboard (case-insensitive). */
export const FACILITY_SCOPE_ROLE_NAMES = ['Facility Manager', 'Facility Admin'] as const

export function roleNameIsFacilityScope(name: string | null | undefined): boolean {
  const n = name?.trim().toLowerCase()
  if (!n) return false
  return FACILITY_SCOPE_ROLE_NAMES.some((s) => s.toLowerCase() === n)
}

/** Facility Manager / Facility Admin — same product surface, different display names. */
export function isFacilityManager(user: UserWithRoles | null | undefined): boolean {
  if (!user?.roles?.length) return false
  return user.roles.some((role) => roleNameIsFacilityScope(role.name))
}

/** Returns the DB role name for sidebar headings (e.g. "Facility Admin"). */
export function getFacilityScopeRoleDisplayName(user: UserWithRoles | null | undefined): string | null {
  if (!user?.roles?.length) return null
  const match = user.roles.find((role) => roleNameIsFacilityScope(role.name))
  return match?.name?.trim() ?? null
}
