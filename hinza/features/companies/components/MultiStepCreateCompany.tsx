'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Step1GeneralDetails from './steps/Step1GeneralDetails'
import Step2CreateRoles from './steps/Step2CreateRoles'
import Step3CreateTemplates from './steps/Step3CreateTemplates'
import Step4CreateProducts from './steps/Step4CreateProducts'
import Step5CreateFacilities from './steps/Step5CreateFacilities'

interface CompanyFormData {
  // Step 1
  name: string
  admin_email: string
  admin_name: string
  // Step 2
  roles: Array<{
    name: string
    permission_ids: number[]
  }>
  // Step 3
  templates: Array<{
    name: string
    description?: string
    fields?: Array<{
      field_name: string
      field_type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'boolean'
      is_required: boolean
      field_order: number
      options?: string[]
    }>
  }>
  // Step 4
  products: Array<{
    name: string
    parent_id?: string
    description?: string
  }>
  // Step 5
  facilities: Array<{
    name: string
    description?: string
    address?: string
    city?: string
    state?: string
    country?: string
    postal_code?: string
    phone?: string
    email?: string
  }>
}

const TOTAL_STEPS = 5

export default function MultiStepCreateCompany() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdCompanyId, setCreatedCompanyId] = useState<string | null>(null)

  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    admin_email: '',
    admin_name: '',
    roles: [],
    templates: [],
    products: [],
    facilities: [],
  })

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
      setError(null)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError(null)
    }
  }

  const handleSkip = () => {
    if (currentStep === TOTAL_STEPS) {
      // On final step, skip means finish setup
      handleFinalSubmit()
    } else if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
      setError(null)
    }
  }

  const handleStep1Submit = async (data: {
    name: string
    admin_email: string
    admin_name: string
  }) => {
    setLoading(true)
    setError(null)

    try {
      // Create company first
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          admin_email: data.admin_email,
          admin_name: data.admin_name,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create company')
      }

      const company = await response.json()
      setCreatedCompanyId(company.id)
      setFormData({ ...formData, ...data })
      setCurrentStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleFinalSubmit = async () => {
    if (!createdCompanyId) {
      setError('Company must be created first')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create roles if any
      if (formData.roles.length > 0) {
        for (const role of formData.roles) {
          await fetch('/api/roles', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: role.name,
              company_id: createdCompanyId,
              permission_ids: role.permission_ids,
            }),
          })
        }
      }

      // Create templates if any
      if (formData.templates.length > 0) {
        for (const template of formData.templates) {
          await fetch('/api/templates', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: template.name,
              description: template.description,
              company_id: createdCompanyId,
              fields: template.fields || [],
            }),
          })
        }
      }

      // Create products if any
      if (formData.products.length > 0) {
        for (const product of formData.products) {
          const productData: any = {
            name: product.name,
            company_id: createdCompanyId,
            parent_id: product.parent_id,
          }
          
          // Only include description if provided
          if (product.description) {
            productData.description = product.description
          }
          
          await fetch('/api/products', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData),
          })
        }
      }

      // Create facilities if any
      if (formData.facilities.length > 0) {
        for (const facility of formData.facilities) {
          await fetch('/api/facilities', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...facility,
              company_id: createdCompanyId,
            }),
          })
        }
      }

      router.push('/companies')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  const updateFormData = (stepData: Partial<CompanyFormData>) => {
    setFormData({ ...formData, ...stepData })
  }

  return (
    <div className="max-w-4xl rounded-lg border border-gray-200 bg-white p-6 shadow">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                    step < currentStep
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : step === currentStep
                        ? 'border-blue-600 bg-white text-blue-600'
                        : 'border-gray-300 bg-white text-gray-400'
                  }`}
                >
                  {step < currentStep ? '✓' : step}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    step <= currentStep ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {step === 1 && 'General'}
                  {step === 2 && 'Roles'}
                  {step === 3 && 'Templates'}
                  {step === 4 && 'Products'}
                  {step === 5 && 'Facilities'}
                </span>
              </div>
              {step < TOTAL_STEPS && (
                <div
                  className={`mx-2 h-1 flex-1 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Step Content */}
      <div className="mb-6">
        {currentStep === 1 && (
          <Step1GeneralDetails
            initialData={{
              name: formData.name,
              admin_email: formData.admin_email,
              admin_name: formData.admin_name,
            }}
            onSubmit={handleStep1Submit}
            loading={loading}
          />
        )}

        {currentStep === 2 && createdCompanyId && (
          <Step2CreateRoles
            companyId={createdCompanyId}
            initialRoles={formData.roles}
            onUpdate={(roles) => updateFormData({ roles })}
            onSkip={handleSkip}
            onNext={handleNext}
          />
        )}

        {currentStep === 3 && createdCompanyId && (
          <Step3CreateTemplates
            companyId={createdCompanyId}
            initialTemplates={formData.templates}
            onUpdate={(templates) => updateFormData({ templates })}
            onSkip={handleSkip}
            onNext={handleNext}
          />
        )}

        {currentStep === 4 && createdCompanyId && (
          <Step4CreateProducts
            companyId={createdCompanyId}
            initialProducts={formData.products}
            onUpdate={(products) => updateFormData({ products })}
            onSkip={handleSkip}
            onNext={handleNext}
          />
        )}

        {currentStep === 5 && createdCompanyId && (
          <Step5CreateFacilities
            companyId={createdCompanyId}
            initialFacilities={formData.facilities}
            onUpdate={(facilities) => updateFormData({ facilities })}
            onSkip={handleFinalSubmit}
            onSubmit={handleFinalSubmit}
            loading={loading}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      {currentStep > 1 && currentStep < 5 && (
        <div className="flex justify-between border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={handlePrevious}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Previous
          </button>
          <div className="space-x-4">
            <button
              type="button"
              onClick={handleSkip}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {currentStep === 5 && (
        <div className="flex justify-between border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={handlePrevious}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Previous
          </button>
        </div>
      )}
    </div>
  )
}
