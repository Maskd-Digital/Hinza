'use client'

import { useState, useEffect, useMemo } from 'react'
import Modal from '@/components/Modal'
import { Product } from '@/types/product'
import { buildProductTree, ProductTreeNode } from '@/lib/utils/product-tree'

interface ViewProductsModalProps {
  isOpen: boolean
  onClose: () => void
  companyId: string
}

export default function ViewProductsModal({
  isOpen,
  onClose,
  companyId,
}: ViewProductsModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    if (isOpen && companyId) {
      fetchProducts()
    }
  }, [isOpen, companyId])

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/products?company_id=${companyId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      const data = await response.json()
      setProducts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const productTree = useMemo(() => {
    if (products.length === 0) return []
    return buildProductTree(products)
  }, [products])

  const renderProductTree = (nodes: ProductTreeNode[], level: number = 0) => {
    return nodes.map((node) => (
      <div key={node.id} className="ml-4">
        <div className="flex items-start gap-2 py-2">
          <div className="flex-shrink-0 pt-1">
            {level > 0 && (
              <svg
                className="h-5 w-5 text-[#081636]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#081636]">{node.name}</span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                Level {node.level}
              </span>
            </div>
            {node.description && (
              <p className="mt-1 text-sm text-[#081636]">{node.description}</p>
            )}
            <p className="mt-1 text-xs text-[#081636]">
              Path: {node.path}
            </p>
          </div>
        </div>
        {node.children.length > 0 && (
          <div className="border-l-2 border-gray-200 pl-4">
            {renderProductTree(node.children, level + 1)}
          </div>
        )}
      </div>
    ))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Company Products" size="xl">
      <div className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-[#081636]">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="py-8 text-center text-[#081636]">
            No products found for this company.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="mb-4 flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <p className="text-sm font-medium text-[#081636]">
                Total Products: {products.length}
              </p>
              <p className="text-sm text-[#081636]">
                Root Products: {productTree.length}
              </p>
            </div>
            <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-gray-200 bg-white p-4">
              {productTree.length > 0 ? (
                renderProductTree(productTree)
              ) : (
                <p className="text-center text-[#081636]">No products to display</p>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-[#081636] hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
