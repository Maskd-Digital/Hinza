/** Facility fields joined when fetching complaints (address = location) */
export interface FacilityLocation {
  address?: string | null
  name?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  postal_code?: string | null
}

export interface Complaint {
  id: string
  company_id: string
  title: string
  description: string | null
  status: string
  priority: string | null
  created_at: string
  updated_at: string | null
  assigned_to_id: string | null
  product_id: string | null
  facility_id?: string | null
  template_id: string | null
  /** Joined from complaint_master_templates (complaint type/template via template_id); API may return as template (alias) or complaint_master_templates */
  template?: { name: string } | null
  complaint_master_templates?: { name: string } | null
  /** Joined from products table (product name via product_id) */
  products?: { name: string } | null
  /** Joined from facilities table (address via facility_id) */
  facilities?: FacilityLocation | null
  /** Facility machinery / equipment (joined via equipment_id) */
  facility_equipment?: {
    name: string
    asset_tag?: string | null
    model?: string | null
  } | null
  equipment_id?: string | null
  facility_escalated_at?: string | null
  facility_escalated_by?: string | null
  /** Template-defined fields stored as JSON: object of field name -> value, or array of { field_name, value } */
  custom_fields?: Record<string, unknown> | Array<{ field_name?: string; name?: string; value?: unknown }> | null
  /** Hierarchy: parent complaint id */
  parent_id?: string | null
  /** Hierarchy level (default 0) */
  level?: number
  /** User who submitted the complaint */
  submitted_by_id?: string | null
  /** Links to company_complaint_types */
  complaint_type_id?: string | null
  batch_id?: string | null
  /** Deadline for resolution (QA Executive) */
  deadline?: string | null
  /** When executive sent complaint for QA Manager verification */
  submitted_for_verification_at?: string | null
  capa_document_url?: string | null
  sla_document_url?: string | null
  capa_verified_at?: string | null
  sla_verified_at?: string | null
  verified_by?: string | null
  /** Review flow: pending_review | approved | rejected */
  review_status?: string | null
  reviewed_at?: string | null
  reviewed_by?: string | null
  rejection_reason?: string | null
}

export interface ComplaintComment {
  id: string
  complaint_id: string
  user_id: string | null
  body: string
  created_at: string
  /** Joined: author display name */
  user?: { full_name: string | null; email: string | null } | null
}

export interface ComplaintDocument {
  id: string
  complaint_id: string
  document_type: 'capa' | 'sla'
  file_path: string
  file_name: string | null
  uploaded_at: string
  uploaded_by: string | null
  /** Joined: uploader display name */
  uploader?: { full_name: string | null; email: string | null } | null
}

export interface Notification {
  id: string
  user_id: string
  company_id: string
  type: string
  related_entity_type: string | null
  related_entity_id: string | null
  title: string
  body: string | null
  read_at: string | null
  created_at: string
}

export interface UpdateComplaintInput {
  title?: string
  description?: string
  status?: string
  priority?: string
  assigned_to_id?: string | null
  deadline?: string | null
  submitted_for_verification_at?: string | null
  capa_document_url?: string | null
  sla_document_url?: string | null
  capa_verified_at?: string | null
  sla_verified_at?: string | null
  verified_by?: string | null
  review_status?: string | null
  reviewed_at?: string | null
  reviewed_by?: string | null
  rejection_reason?: string | null
}
