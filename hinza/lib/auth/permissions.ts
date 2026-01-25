import { Permission } from '@/types/auth'

// System Administration Company ID
// Users with this company_id are system-level administrators (superadmins)
export const SYSTEM_ADMIN_COMPANY_ID = '00000000-0000-0000-0000-000000000001'

// Helper to check if a company_id belongs to system administration
export function isSystemAdmin(companyId: string | null | undefined): boolean {
  return companyId === SYSTEM_ADMIN_COMPANY_ID
}

// Permission names that match the database
export type PermissionName =
  | 'companies:read'
  | 'companies:create'
  | 'companies:update'
  | 'companies:delete'
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  | 'products:read'
  | 'products:create'
  | 'products:update'
  | 'products:delete'
  | 'complaints:read'
  | 'complaints:create'
  | 'complaints:update'
  | 'complaints:assign'
  | 'complaints:resolve'
  | 'facilities:read'
  | 'facilities:create'
  | 'facilities:update'
  | 'facilities:delete'
  | 'templates:read'
  | 'templates:create'
  | 'templates:update'
  | 'templates:delete'
  | 'roles:read'
  | 'roles:create'
  | 'roles:update'
  | 'roles:delete'
  | 'reports:read'
  | 'audit:read'
  | 'dashboard:view'

export function hasPermission(
  userPermissions: Permission[],
  permissionName: PermissionName
): boolean {
  return userPermissions.some((p) => p.name === permissionName)
}

export function canAccessRoute(
  userPermissions: Permission[],
  route: string
): boolean {
  // Route-based access control using permissions
  const routePermissions: Record<string, PermissionName[]> = {
    '/companies': ['companies:read'],
    '/users': ['users:read'],
    '/complaints': ['complaints:read'],
    '/facilities': ['facilities:read'],
    '/templates': ['templates:read'],
    '/reports': ['reports:read'],
    '/audit': ['audit:read'],
  }

  for (const [routePath, requiredPermissions] of Object.entries(
    routePermissions
  )) {
    if (route.startsWith(routePath)) {
      return requiredPermissions.some((perm) =>
        hasPermission(userPermissions, perm)
      )
    }
  }

  return false
}

// Helper to check if user has any of the specified permissions
export function hasAnyPermission(
  userPermissions: Permission[],
  permissionNames: PermissionName[]
): boolean {
  return permissionNames.some((name) =>
    hasPermission(userPermissions, name)
  )
}

// Helper to check if user has all of the specified permissions
export function hasAllPermissions(
  userPermissions: Permission[],
  permissionNames: PermissionName[]
): boolean {
  return permissionNames.every((name) =>
    hasPermission(userPermissions, name)
  )
}
