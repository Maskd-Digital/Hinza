'use client'

import { useState, useEffect } from 'react'

interface TemplateField {
  id: string | null
  field_name: string
  field_type: string
  is_required: boolean
  field_order: number
  options: string[]
}

interface Template {
  id: string
  name: string
  description: string | null
  source_template_id: string
  fields: TemplateField[]
}

interface TemplatesListPageProps {
  companyId: string
  canCreateTemplates: boolean
}

export default function TemplatesListPage({
  companyId,
  canCreateTemplates,
}: TemplatesListPageProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [companyId])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/templates?company_id=${companyId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }
      const data = await response.json()
      setTemplates(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter(
    (t) =>
      searchQuery === '' ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getFieldTypeIcon = (fieldType: string) => {
    switch (fieldType) {
      case 'text':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        )
      case 'textarea':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        )
      case 'number':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
        )
      case 'select':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        )
      case 'date':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      case 'checkbox':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )
    }
  }

  const getFieldTypeBadgeColor = (fieldType: string) => {
    switch (fieldType) {
      case 'text':
        return 'bg-blue-100 text-blue-700'
      case 'textarea':
        return 'bg-indigo-100 text-indigo-700'
      case 'number':
        return 'bg-green-100 text-green-700'
      case 'select':
        return 'bg-purple-100 text-purple-700'
      case 'date':
        return 'bg-orange-100 text-orange-700'
      case 'checkbox':
        return 'bg-teal-100 text-teal-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage complaint templates and their fields
          </p>
        </div>
        {canCreateTemplates && (
          <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Template
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm font-medium text-gray-500">Total Templates</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{templates.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm font-medium text-gray-500">Total Fields</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {templates.reduce((acc, t) => acc + t.fields.length, 0)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm font-medium text-gray-500">Avg Fields/Template</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {templates.length > 0
              ? (templates.reduce((acc, t) => acc + t.fields.length, 0) / templates.length).toFixed(1)
              : '0'}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {searchQuery ? 'No templates match your search' : 'No templates yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery
              ? 'Try adjusting your search terms'
              : 'Get started by creating your first template.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="rounded-lg border border-gray-200 bg-white overflow-hidden"
            >
              {/* Template Header */}
              <div
                className="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50"
                onClick={() =>
                  setExpandedTemplate(expandedTemplate === template.id ? null : template.id)
                }
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-500">
                      {template.description || 'No description'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                    {template.fields.length} field{template.fields.length !== 1 ? 's' : ''}
                  </span>
                  <svg
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      expandedTemplate === template.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Fields List */}
              {expandedTemplate === template.id && (
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                  {template.fields.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No fields defined</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Template Fields
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {template.fields
                          .sort((a, b) => a.field_order - b.field_order)
                          .map((field, index) => (
                            <div
                              key={field.id || `${template.id}-field-${index}`}
                              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3"
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                                {getFieldTypeIcon(field.field_type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {field.field_name}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${getFieldTypeBadgeColor(
                                      field.field_type
                                    )}`}
                                  >
                                    {field.field_type}
                                  </span>
                                  {field.is_required && (
                                    <span className="text-xs text-red-500">Required</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="text-sm text-gray-500">
        Showing {filteredTemplates.length} of {templates.length} templates
      </div>
    </div>
  )
}
