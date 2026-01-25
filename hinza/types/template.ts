export interface ComplaintMasterTemplate {
  id: string
  name: string
  description: string | null
  company_id?: string | null
  fields?: ComplaintMasterTemplateField[] // JSONB array from database
}

export interface ComplaintMasterTemplateField {
  id: string
  template_id: string
  field_name: string
  field_type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'boolean' | 'file'
  is_required: boolean
  field_order: number
  options?: string[] // For select fields
}

export interface CompanyComplaintType {
  id: string
  company_id: string
  name: string
  source_template_id: string | null
}

export interface CreateTemplateInput {
  name: string
  description?: string
  company_id: string
  fields?: Array<{
    field_name: string
    field_type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'boolean' | 'file'
    is_required: boolean
    field_order: number
    options?: string[]
  }>
}
