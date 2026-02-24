'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/Modal'

interface TemplateField {
  field_name: string
  field_type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'boolean' | 'file'
  is_required: boolean
  field_order: number
  options?: string[]
}

interface AddTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  companyId: string
}

export default function AddTemplateModal({
  isOpen,
  onClose,
  companyId,
}: AddTemplateModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [description, setDescription] = useState('')
  const [fields, setFields] = useState<TemplateField[]>([])

  const addField = () => {
    setFields([
      ...fields,
      {
        field_name: '',
        field_type: 'text',
        is_required: false,
        field_order: fields.length,
      },
    ])
  }

  const removeField = (index: number) => {
    const updated = fields.filter((_, i) => i !== index)
    // Reorder fields
    updated.forEach((field, i) => {
      field.field_order = i
    })
    setFields(updated)
  }

  const updateField = (
    index: number,
    field: keyof TemplateField,
    value: any
  ) => {
    const updated = [...fields]
    updated[index] = { ...updated[index], [field]: value }
    setFields(updated)
  }

  const updateFieldOptions = (index: number, optionsString: string) => {
    const options = optionsString
      .split(',')
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0)
    updateField(index, 'options', options)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate select fields have options
    const invalidSelectField = fields.find(
      (field) => field.field_type === 'select' && (!field.options || field.options.length === 0)
    )

    if (invalidSelectField) {
      setError('Select fields must have at least one option')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: templateName,
          description: description || undefined,
          company_id: companyId,
          fields: fields.length > 0 ? fields : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create template')
      }

      // Success - close modal and refresh
      handleClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTemplateName('')
    setDescription('')
    setFields([])
    setError(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Complaint Template" size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[#081636]">
            Template Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-[#081636] shadow-sm placeholder:text-[#081636] focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="e.g., Product Quality Issue, Customer Service"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#081636]">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-[#081636] shadow-sm placeholder:text-[#081636] focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="Describe what this template is used for..."
          />
        </div>

        {/* Template Fields Section */}
        <div className="border-t border-gray-200 pt-4">
          <div className="mb-4 flex items-center justify-between">
            <label className="block text-sm font-medium text-[#081636]">
              Template Fields
            </label>
            <button
              type="button"
              onClick={addField}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Add Field
            </button>
          </div>

          {fields.length > 0 ? (
            <div className="space-y-4">
              {fields.map((field, fieldIndex) => (
                <div
                  key={fieldIndex}
                  className="rounded-md border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-[#081636]">
                      Field {fieldIndex + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeField(fieldIndex)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-[#081636]">
                        Field Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={field.field_name}
                        onChange={(e) =>
                          updateField(fieldIndex, 'field_name', e.target.value)
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-[#081636] shadow-sm placeholder:text-[#081636] focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        placeholder="e.g., Product Name, Issue Description"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#081636]">
                        Field Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={field.field_type}
                        onChange={(e) =>
                          updateField(
                            fieldIndex,
                            'field_type',
                            e.target.value as TemplateField['field_type']
                          )
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        required
                      >
                        <option value="text">Text</option>
                        <option value="textarea">Textarea</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="select">Select (Dropdown)</option>
                        <option value="boolean">Boolean (Yes/No)</option>
                        <option value="file">File Upload</option>
                      </select>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`required-${fieldIndex}`}
                        checked={field.is_required}
                        onChange={(e) =>
                          updateField(fieldIndex, 'is_required', e.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`required-${fieldIndex}`}
                        className="ml-2 text-xs text-[#081636]"
                      >
                        Required field
                      </label>
                    </div>

                    {field.field_type === 'select' && (
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-[#081636]">
                          Options <span className="text-red-500">*</span>
                          <span className="ml-1 text-xs text-[#081636]">
                            (comma-separated)
                          </span>
                        </label>
                        <input
                          type="text"
                          value={field.options?.join(', ') || ''}
                          onChange={(e) =>
                            updateFieldOptions(fieldIndex, e.target.value)
                          }
                          className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-[#081636] shadow-sm placeholder:text-[#081636] focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          placeholder="e.g., Option 1, Option 2, Option 3"
                          required={field.field_type === 'select'}
                        />
                        {field.field_type === 'select' &&
                          (!field.options || field.options.length === 0) && (
                            <p className="mt-1 text-xs text-red-600">
                              At least one option is required for select fields
                            </p>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-gray-300 p-4 text-center">
              <p className="text-xs text-[#081636]">
                No fields added. Click "Add Field" to add fields to this template.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4 border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-[#081636] hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !templateName.trim()}
            className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Template'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
