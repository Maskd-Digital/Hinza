export interface FacilityEquipment {
  id: string
  company_id: string
  facility_id: string
  name: string
  asset_tag: string | null
  model: string | null
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export interface CreateFacilityEquipmentInput {
  company_id: string
  facility_id: string
  name: string
  asset_tag?: string | null
  model?: string | null
  description?: string | null
  is_active?: boolean
}

export interface UpdateFacilityEquipmentInput {
  name?: string
  asset_tag?: string | null
  model?: string | null
  description?: string | null
  is_active?: boolean
}

export interface FacilityManagerAssignment {
  user_id: string
  facility_id: string
  company_id: string
  created_at: string
}
