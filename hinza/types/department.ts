export interface Department {
  id: string
  company_id: string
  name: string
  code: string | null
  sort_order: number
  created_at?: string
  updated_at?: string | null
}
