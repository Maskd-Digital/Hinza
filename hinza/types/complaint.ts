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
  template_id: string | null
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
}
