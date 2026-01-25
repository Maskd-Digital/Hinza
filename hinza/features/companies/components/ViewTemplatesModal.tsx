'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/Modal'

interface ViewTemplatesModalProps {
  isOpen: boolean
  onClose: () => void
  companyId: string
}

interface Template {
  id: string
  name: string
  description: string | null
  source_template_id: string | null
  fields?: Array<{
    id: string | null
    field_name: string
    field_type: string
    is_required: boolean
    field_order: number
    options?: string[]
  }>
}

export default function ViewTemplatesModal({
  isOpen,
  onClose,
  companyId,
}: ViewTemplatesModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])

  useEffect(() => {
    if (isOpen && companyId) {
      fetchTemplates()
    }
  }, [isOpen, companyId])

  const fetchTemplates = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch company complaint types (templates)
      const response = await fetch(`/api/templates?company_id=${companyId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }
      const data = await response.json()
      setTemplates(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complaint Templates" size="xl">
      <div className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-gray-500">
            Loading templates...
          </div>
        ) : templates.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No templates found for this company.
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {template.name}
                  </h3>
                  {template.description && (
                    <p className="mt-1 text-sm text-gray-600">
                      {template.description}
                    </p>
                  )}
                </div>

                {template.fields && template.fields.length > 0 ? (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-medium text-gray-700">
                      Fields ({template.fields.length}):
                    </p>
                    <div className="space-y-2">
                      {template.fields
                        .sort((a, b) => a.field_order - b.field_order)
                        .map((field, fieldIndex) => (
                          <div
                            key={field.id || `${template.id}-field-${fieldIndex}-${field.field_name}`}
                            className="rounded-md border border-gray-100 bg-gray-50 p-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {field.field_name}
                                </span>
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                  {field.field_type}
                                </span>
                                {field.is_required && (
                                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                                    Required
                                  </span>
                                )}
                              </div>
                            </div>
                            {field.options && field.options.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-600">Options:</p>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {field.options.map((option, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center rounded-md bg-gray-200 px-2 py-0.5 text-xs text-gray-700"
                                    >
                                      {option}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No fields defined</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
