import { User } from './auth'

export interface CreateUserInput {
  email: string
  full_name: string
  company_id: string
  role_ids?: string[] // Array of role IDs to assign
}

export interface UpdateUserInput {
  full_name?: string
  email?: string
  is_active?: boolean
  role_ids?: string[] // Update roles
}

export interface InviteUserInput {
  email: string
  full_name: string
  company_id: string
  role_ids?: string[]
  password?: string // Initial password - user can change it later
}
