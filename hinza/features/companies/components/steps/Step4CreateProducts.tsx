'use client'

import { useState, useEffect, useMemo } from 'react'
import { Product } from '@/types/product'
import { buildProductTree, flattenProductTree } from '@/lib/utils/product-tree'

interface ProductFormData {
  name: string
  parent_id?: string
  description?: string
}

interface Step4CreateProductsProps {
  companyId: string
  initialProducts: ProductFormData[]
  onUpdate: (products: ProductFormData[]) => void
  onSkip: () => void
  onNext: () => void
}

export default function Step4CreateProducts({
  companyId,
  initialProducts,
  onUpdate,
  onSkip,
  onNext,
}: Step4CreateProductsProps) {
  const [products, setProducts] = useState<ProductFormData[]>(initialProducts)
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
    // Fetch existing products for parent selection
    setFetchingProducts(true)
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
  }, [companyId])

  const addProduct = () => {
    const updated = [...products, { name: '' }]
    setProducts(updated)
    onUpdate(updated)
  }

  const removeProduct = (index: number) => {
    const updated = products.filter((_, i) => i !== index)
    setProducts(updated)
    onUpdate(updated)
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
    onUpdate(updated)
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-gray-900">
        Step 4: Create Product Master (Optional)
      </h2>
      <p className="mb-6 text-sm text-gray-600">
        Define products for this company. Products can be hierarchical (parent-child
        relationships). You can skip this and add products later.
      </p>

      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">No products added yet.</p>
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
                <h3 className="text-lg font-medium text-gray-900">
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
                  <label className="block text-sm font-medium text-gray-700">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={product.name}
                    onChange={(e) =>
                      updateProduct(index, 'name', e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    placeholder="e.g., Product A, Category B"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Parent Product
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      (Optional - leave empty for root-level product)
                    </span>
                  </label>
                  {fetchingProducts ? (
                    <div className="mt-1 text-sm text-gray-500">
                      Loading existing products...
                    </div>
                  ) : flattenedProducts.length > 0 ? (
                    <select
                      value={product.parent_id || ''}
                      onChange={(e) =>
                        updateProduct(index, 'parent_id', e.target.value || undefined)
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    >
                      <option value="">None (Top-level / Root product)</option>
                      {flattenedProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.displayName} {p.level > 0 && `(Level ${p.level})`}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="mt-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                      No existing products. This will be created as a root-level product.
                    </div>
                  )}
                  {product.parent_id && (
                    <p className="mt-1 text-xs text-gray-500">
                      This product will be created as a child of the selected parent. The hierarchy level will be automatically calculated.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      (Optional)
                    </span>
                  </label>
                  <textarea
                    value={product.description || ''}
                    onChange={(e) =>
                      updateProduct(index, 'description', e.target.value)
                    }
                    rows={2}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    placeholder="Product description..."
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addProduct}
            className="w-full rounded-md border border-dashed border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            + Add Another Product
          </button>
        </div>
      )}
    </div>
  )
}
