export interface Facility {
  id: string
  company_id: string
  name: string
  description: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  postal_code: string | null
  phone: string | null
  email: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateFacilityInput {
  company_id: string
  name: string
  description?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  phone?: string
  email?: string
  is_active?: boolean
}

export interface UpdateFacilityInput {
  name?: string
  description?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  phone?: string
  email?: string
  is_active?: boolean
}
