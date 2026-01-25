export interface Product {
  id: string
  company_id: string
  parent_id: string | null
  name: string
  level: number
  description?: string | null
  created_at?: string
  updated_at?: string
}

export interface CreateProductInput {
  name: string
  company_id: string
  parent_id?: string
  description?: string
  // level is auto-calculated by database, so it's optional and typically not provided
  level?: number
}
