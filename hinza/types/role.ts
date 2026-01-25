export interface Role {
  id: string
  company_id: string
  name: string
}

export interface CreateRoleInput {
  name: string
  company_id: string
  permission_ids: number[]
}

export interface UpdateRoleInput {
  name?: string
  permission_ids?: number[]
}