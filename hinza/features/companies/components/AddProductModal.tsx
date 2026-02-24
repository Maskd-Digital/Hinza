'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/Modal'
import { Product } from '@/types/product'
import { buildProductTree, flattenProductTree } from '@/lib/utils/product-tree'

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  companyId: string
}

interface ProductFormData {
  name: string
  parent_id?: string
  description?: string
}

export default function AddProductModal({
  isOpen,
  onClose,
  companyId,
}: AddProductModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<ProductFormData[]>([])
  const [existingProducts, setExistingProducts] = useState<Product[]>([])
  const [fetchingProducts, setFetchingProducts] = useState(false)

  // Build tree structure and flattened list for dropdown
  const productTree = useMemo(() => {
    if (existingProducts.length === 0) return []
    return buildProductTree(existingProducts)
  }, [existingProducts])

  const flattenedProducts = useMemo(() => {
    return flattenProductTree(productTree)
  }, [productTree])

  useEffect(() => {
    if (isOpen) {
      setFetchingProducts(true)
      // Fetch existing products for parent selection
      fetch(`/api/products?company_id=${companyId}`)
        .then((res) => res.json())
        .then((data) => {
          setExistingProducts(data || [])
          setFetchingProducts(false)
        })
        .catch(() => {
          setExistingProducts([])
          setFetchingProducts(false)
        })
    }
  }, [isOpen, companyId])

  const addProduct = () => {
    setProducts([...products, { name: '' }])
  }

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index))
  }

  const updateProduct = (
    index: number,
    field: keyof ProductFormData,
    value: string | undefined
  ) => {
    const updated = products.map((product, i) =>
      i === index ? { ...product, [field]: value } : product
    )
    setProducts(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate all products have names
    const invalidProduct = products.find((p) => !p.name.trim())
    if (invalidProduct) {
      setError('All products must have a name')
      setLoading(false)
      return
    }

    try {
      // Create products one by one
      const results = []
      for (const product of products) {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: product.name.trim(),
            company_id: companyId,
            parent_id: product.parent_id || undefined,
            // Level is automatically calculated by the database trigger
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Failed to create product: ${product.name}`)
        }

        const data = await response.json()
        results.push(data)
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
    setProducts([])
    setError(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Product(s)" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {products.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
            <p className="text-sm text-[#081636]">No products added yet.</p>
            <button
              type="button"
              onClick={addProduct}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Add First Product
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {products.map((product, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-200 p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-[#081636]">
                    Product {index + 1}
                  </h3>
                  <button
                    type="button"
                    onClick={() => removeProduct(index)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#081636]">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={product.name}
                      onChange={(e) =>
                        updateProduct(index, 'name', e.target.value)
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-[#081636] shadow-sm placeholder:text-[#081636] focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      placeholder="e.g., Product A, Category B"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#081636]">
                      Parent Product
                      <span className="ml-2 text-xs font-normal text-[#081636]">
                        (Optional - leave empty for root-level product)
                      </span>
                    </label>
                    {fetchingProducts ? (
                      <div className="mt-1 text-sm text-[#081636]">
                        Loading existing products...
                      </div>
                    ) : flattenedProducts.length > 0 ? (
                      <select
                        value={product.parent_id || ''}
                        onChange={(e) =>
                          updateProduct(index, 'parent_id', e.target.value || undefined)
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-[#081636] shadow-sm placeholder:text-[#081636] focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      >
                        <option value="">None (Top-level / Root product)</option>
                        {flattenedProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.displayName} {p.level > 0 && `(Level ${p.level})`}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="mt-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-[#081636]">
                        No existing products. This will be created as a root-level product.
                      </div>
                    )}
                    {product.parent_id && (
                      <p className="mt-1 text-xs text-[#081636]">
                        This product will be created as a child of the selected parent. The hierarchy level will be automatically calculated.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#081636]">
                      Description
                      <span className="ml-2 text-xs font-normal text-[#081636]">
                        (Optional)
                      </span>
                    </label>
                    <textarea
                      value={product.description || ''}
                      onChange={(e) =>
                        updateProduct(index, 'description', e.target.value)
                      }
                      rows={2}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-[#081636] shadow-sm placeholder:text-[#081636] focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      placeholder="Product description..."
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addProduct}
              className="w-full rounded-md border border-dashed border-gray-300 bg-white px-4 py-3 text-sm font-medium text-[#081636] hover:bg-gray-50"
            >
              + Add Another Product
            </button>
          </div>
        )}

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
            disabled={loading || products.length === 0}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Product(s)'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
