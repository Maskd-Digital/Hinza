// Database schema types matching the actual Supabase schema
export interface User {
  id: string // References auth.users(id)
  company_id: string
  full_name: string | null
  email: string | null
  is_active: boolean
}

export interface Role {
  id: string
  company_id: string
  name: string
}

export interface Permission {
  id: number
  name: string
  description: string | null
}

export interface UserRole {
  user_id: string
  role_id: string
}

export interface RolePermission {
  role_id: string
  permission_id: number
}

// Extended user with roles (for frontend use)
export interface UserWithRoles extends User {
  roles: Role[]
  permissions: Permission[]
}

// Legacy role enum for backward compatibility (can be removed if not needed)
export enum UserRoleEnum {
  SUPERADMIN = 'superadmin',
  COMPANY_ADMIN = 'company_admin',
  MANAGEMENT = 'management',
  QA_MANAGER = 'qa_manager',
  QA_EXECUTIVE = 'qa_executive',
  EMPLOYEE = 'employee',
}

export interface Session {
  user: UserWithRoles
  access_token: string
  expires_at: number
}
