export interface Company {
  id: string
  name: string
  created_at: string
}

export interface CreateCompanyInput {
  name: string
  admin_email: string
  admin_name: string
  // Optional steps data
  roles?: Array<{
    name: string
    permission_ids: number[]
  }>
  templates?: Array<{
    name: string
    description?: string
  }>
  products?: Array<{
    name: string
    parent_id?: string
    level?: number
  }>
}

export interface UpdateCompanyInput {
  name?: string
}
