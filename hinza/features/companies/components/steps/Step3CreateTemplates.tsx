'use client'

import { useState } from 'react'

interface TemplateField {
  field_name: string
  field_type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'boolean' | 'file'
  is_required: boolean
  field_order: number
  options?: string[]
}

interface Template {
  name: string
  description?: string
  fields?: TemplateField[]
}

interface Step3CreateTemplatesProps {
  companyId: string
  initialTemplates: Template[]
  onUpdate: (templates: Template[]) => void
  onSkip: () => void
  onNext: () => void
}

export default function Step3CreateTemplates({
  companyId,
  initialTemplates,
  onUpdate,
  onSkip,
  onNext,
}: Step3CreateTemplatesProps) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)

  const addTemplate = () => {
    setTemplates([...templates, { name: '', description: '', fields: [] }])
    onUpdate([...templates, { name: '', description: '', fields: [] }])
  }

  const removeTemplate = (index: number) => {
    const updated = templates.filter((_, i) => i !== index)
    setTemplates(updated)
    onUpdate(updated)
  }

  const updateTemplate = (
    index: number,
    field: keyof Template,
    value: any
  ) => {
    const updated = templates.map((template, i) =>
      i === index ? { ...template, [field]: value } : template
    )
    setTemplates(updated)
    onUpdate(updated)
  }

  const addField = (templateIndex: number) => {
    const template = templates[templateIndex]
    const fields = template.fields || []
    const newField: TemplateField = {
      field_name: '',
      field_type: 'text',
      is_required: false,
      field_order: fields.length,
    }
    const updatedFields = [...fields, newField]
    updateTemplate(templateIndex, 'fields', updatedFields)
  }

  const removeField = (templateIndex: number, fieldIndex: number) => {
    const template = templates[templateIndex]
    const fields = template.fields || []
    const updatedFields = fields.filter((_, i) => i !== fieldIndex)
    // Reorder fields
    updatedFields.forEach((field, i) => {
      field.field_order = i
    })
    updateTemplate(templateIndex, 'fields', updatedFields)
  }

  const updateField = (
    templateIndex: number,
    fieldIndex: number,
    field: keyof TemplateField,
    value: any
  ) => {
    const template = templates[templateIndex]
    const fields = [...(template.fields || [])]
    fields[fieldIndex] = { ...fields[fieldIndex], [field]: value }
    updateTemplate(templateIndex, 'fields', fields)
  }

  const updateFieldOptions = (
    templateIndex: number,
    fieldIndex: number,
    optionsString: string
  ) => {
    const options = optionsString
      .split(',')
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0)
    updateField(templateIndex, fieldIndex, 'options', options)
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-[#081636]">
        Step 3: Create Complaint Templates (Optional)
      </h2>
      <p className="mb-6 text-sm text-[#081636]">
        Define complaint templates for this company. Templates help standardize
        complaint types. You can add fields to each template to capture specific
        information. You can skip this and create templates later.
      </p>

      {templates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-[#081636]">No templates added yet.</p>
          <button
            type="button"
            onClick={addTemplate}
            className="mt-4 rounded-md px-4 py-2 text-sm text-white hover:opacity-90"
            style={{ backgroundColor: '#0108B8', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}
          >
            Add First Template
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {templates.map((template, templateIndex) => (
            <div
              key={templateIndex}
              className="rounded-lg border border-gray-200 p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium text-[#081636]">
                  Template {templateIndex + 1}
                </h3>
                <button
                  type="button"
                  onClick={() => removeTemplate(templateIndex)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#081636]">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={template.name}
                    onChange={(e) =>
                      updateTemplate(templateIndex, 'name', e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-[#081636] shadow-sm placeholder:text-[#081636] focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    placeholder="e.g., Product Quality Issue, Customer Service"
                    required
                    style={{ backgroundColor: '#FFFFFF', boxShadow: 'inset 0 2px 4px rgba(1, 8, 184, 0.35)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#081636]">
                    Description
                  </label>
                  <textarea
                    value={template.description || ''}
                    onChange={(e) =>
                      updateTemplate(
                        templateIndex,
                        'description',
                        e.target.value
                      )
                    }
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-[#081636] shadow-sm placeholder:text-[#081636] focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    placeholder="Describe what this template is used for..."
                    style={{ backgroundColor: '#FFFFFF', boxShadow: 'inset 0 2px 4px rgba(1, 8, 184, 0.35)' }}
                  />
                </div>

                {/* Template Fields Section */}
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <div className="mb-4 flex items-center justify-between">
                    <label className="block text-sm font-medium text-[#081636]">
                      Template Fields
                    </label>
                    <button
                      type="button"
                      onClick={() => addField(templateIndex)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Add Field
                    </button>
                  </div>

                  {template.fields && template.fields.length > 0 ? (
                    <div className="space-y-4">
                      {template.fields.map((field, fieldIndex) => (
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
                              onClick={() =>
                                removeField(templateIndex, fieldIndex)
                              }
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
                                  updateField(
                                    templateIndex,
                                    fieldIndex,
                                    'field_name',
                                    e.target.value
                                  )
                                }
                                className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-[#081636] shadow-sm placeholder:text-[#081636] focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                placeholder="e.g., Product Name, Issue Description"
                                required
                                style={{ backgroundColor: '#FFFFFF', boxShadow: 'inset 0 2px 4px rgba(1, 8, 184, 0.35)' }}
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
                                    templateIndex,
                                    fieldIndex,
                                    'field_type',
                                    e.target.value as TemplateField['field_type']
                                  )
                                }
                                className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-[#081636] shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                required
                                style={{ backgroundColor: '#FFFFFF', boxShadow: 'inset 0 2px 4px rgba(1, 8, 184, 0.35)' }}
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
                                id={`required-${templateIndex}-${fieldIndex}`}
                                checked={field.is_required}
                                onChange={(e) =>
                                  updateField(
                                    templateIndex,
                                    fieldIndex,
                                    'is_required',
                                    e.target.checked
                                  )
                                }
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <label
                                htmlFor={`required-${templateIndex}-${fieldIndex}`}
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
                                    updateFieldOptions(
                                      templateIndex,
                                      fieldIndex,
                                      e.target.value
                                    )
                                  }
                                  className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-[#081636] shadow-sm placeholder:text-[#081636] focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                  placeholder="e.g., Option 1, Option 2, Option 3"
                                  required={field.field_type === 'select'}
                                  style={{ backgroundColor: '#FFFFFF', boxShadow: 'inset 0 2px 4px rgba(1, 8, 184, 0.35)' }}
                                />
                                {field.field_type === 'select' &&
                                  (!field.options || field.options.length === 0) && (
                                    <p className="mt-1 text-xs text-red-600">
                                      At least one option is required for select
                                      fields
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
                        No fields added. Click "Add Field" to add fields to this
                        template.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addTemplate}
            className="w-full rounded-md border border-dashed border-gray-300 bg-white px-4 py-3 text-sm font-medium text-[#081636] hover:bg-gray-50"
          >
            + Add Another Template
          </button>
        </div>
      )}
    </div>
  )
}
