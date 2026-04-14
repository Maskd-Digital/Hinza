'use client'

import { useState, useEffect, useMemo } from 'react'
import AddProductModal from '@/features/companies/components/AddProductModal'
import BulkAddProductsModal from './BulkAddProductsModal'

interface Product {
  id: string
  name: string
  description: string | null
  parent_id: string | null
  level: number
  company_id: string
}

/** Tree node: product with recursive children (same shape as node). */
type ProductTreeNode = Product & { children: ProductTreeNode[] }

interface ProductsListPageProps {
  companyId: string
  canCreateProducts: boolean
}

export default function ProductsListPage({
  companyId,
  canCreateProducts,
}: ProductsListPageProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [companyId])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/products?company_id=${companyId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      const data = await response.json()
      setProducts(data)
      // Expand all root items by default
      const rootIds = data
        .filter((p: Product) => p.level === 0)
        .map((p: Product) => p.id)
      setExpandedItems(new Set(rootIds))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  // Build tree structure
  const productTree = useMemo((): ProductTreeNode[] => {
    const productMap = new Map<string, ProductTreeNode>()
    const roots: ProductTreeNode[] = []

    // Initialize all products with empty children
    products.forEach((product) => {
      productMap.set(product.id, { ...product, children: [] })
    })

    // Build parent-child relationships
    products.forEach((product) => {
      const node = productMap.get(product.id)!
      if (product.parent_id && productMap.has(product.parent_id)) {
        productMap.get(product.parent_id)!.children.push(node)
      } else {
        roots.push(node)
      }
    })

    return roots
  }, [products])

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [products, searchQuery])

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const expandAll = () => {
    setExpandedItems(new Set(products.map((p) => p.id)))
  }

  const collapseAll = () => {
    setExpandedItems(new Set())
  }

  const renderTreeNode = (
    node: ProductTreeNode,
    depth: number = 0
  ): React.ReactNode => {
    const hasChildren = node.children.length > 0
    const isExpanded = expandedItems.has(node.id)

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-50 ${
            depth > 0 ? 'ml-' + Math.min(depth * 6, 24) : ''
          }`}
          style={{ marginLeft: depth * 24 }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(node.id)}
              className="flex h-6 w-6 items-center justify-center rounded text-[#081636] hover:bg-gray-100 hover:text-[#081636]"
            >
              <svg
                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
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
            </button>
          ) : (
            <div className="w-6" />
          )}
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              node.level === 0
                ? 'bg-blue-100 text-blue-600'
                : node.level === 1
                  ? 'bg-green-100 text-green-600'
                  : node.level === 2
                    ? 'bg-purple-100 text-purple-600'
                    : 'bg-gray-100 text-[#081636]'
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#081636] truncate">{node.name}</p>
            {node.description && (
              <p className="text-xs text-[#081636] truncate">{node.description}</p>
            )}
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              node.level === 0
                ? 'bg-blue-100 text-blue-700'
                : node.level === 1
                  ? 'bg-green-100 text-green-700'
                  : node.level === 2
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-[#081636]'
            }`}
          >
            Level {node.level}
          </span>
        </div>
        {isExpanded && hasChildren && (
          <div>{node.children.map((child) => renderTreeNode(child, depth + 1))}</div>
        )}
      </div>
    )
  }

  const stats = useMemo(() => {
    const byLevel = new Map<number, number>()
    products.forEach((p) => {
      byLevel.set(p.level, (byLevel.get(p.level) || 0) + 1)
    })
    return {
      total: products.length,
      byLevel: Array.from(byLevel.entries()).sort((a, b) => a[0] - b[0]),
    }
  }, [products])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#081636]">Products</h1>
          <p className="mt-1 text-sm text-[#081636]">
            Manage your product hierarchy
          </p>
        </div>
        {canCreateProducts && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              style={{ backgroundColor: '#0108B8', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Product
            </button>
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#081636] hover:bg-gray-50"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Bulk upload
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg bg-white p-4" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
          <p className="text-sm font-medium text-[#081636]">Total Products</p>
          <p className="mt-1 text-2xl font-semibold text-[#081636]">{stats.total}</p>
        </div>
        {stats.byLevel.slice(0, 3).map(([level, count]) => (
          <div key={level} className="rounded-lg bg-white p-4" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
            <p className="text-sm font-medium text-[#081636]">Level {level}</p>
            <p className="mt-1 text-2xl font-semibold text-[#081636]">{count}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-lg bg-white p-4 sm:flex-row sm:items-center sm:justify-between" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm text-[#081636] placeholder:text-[#081636] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            style={{ backgroundColor: '#FFFFFF', boxShadow: 'inset 0 2px 4px rgba(1, 8, 184, 0.25)' }}
          />
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#081636]"
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
        <div className="flex items-center gap-2">
          {viewMode === 'tree' && (
            <>
              <button
                onClick={expandAll}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#081636] hover:opacity-90"
                style={{ backgroundColor: '#FFFFFF', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#081636] hover:opacity-90"
                style={{ backgroundColor: '#FFFFFF', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}
              >
                Collapse All
              </button>
            </>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('tree')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'tree'
                  ? 'text-white'
                  : 'text-gray-700 hover:opacity-90'
              }`}
              style={
                viewMode === 'tree'
                  ? { backgroundColor: '#0108B8', boxShadow: 'inset 0 2px 4px rgba(8, 22, 54, 0.25)' }
                  : { backgroundColor: '#FFFFFF', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }
              }
            >
              Tree
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'text-white'
                  : 'text-gray-700 hover:opacity-90'
              }`}
              style={
                viewMode === 'list'
                  ? { backgroundColor: '#0108B8', boxShadow: 'inset 0 2px 4px rgba(8, 22, 54, 0.25)' }
                  : { backgroundColor: '#FFFFFF', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }
              }
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-lg bg-white overflow-hidden" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="rounded-lg bg-red-50 p-4" style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <svg
              className="h-12 w-12 text-[#081636]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-[#081636]">No products yet</h3>
            <p className="mt-1 text-sm text-[#081636]">
              Get started by adding your first product.
            </p>
          </div>
        ) : viewMode === 'tree' ? (
          <div className="divide-y divide-gray-100 p-4">
            {searchQuery ? (
              // Flat list when searching
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      product.level === 0
                        ? 'bg-blue-100 text-blue-600'
                        : product.level === 1
                          ? 'bg-green-100 text-green-600'
                          : product.level === 2
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-gray-100 text-[#081636]'
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#081636]">{product.name}</p>
                    {product.description && (
                      <p className="text-xs text-[#081636] truncate">{product.description}</p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      product.level === 0
                        ? 'bg-blue-100 text-blue-700'
                        : product.level === 1
                          ? 'bg-green-100 text-green-700'
                          : product.level === 2
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-[#081636]'
                    }`}
                  >
                    Level {product.level}
                  </span>
                </div>
              ))
            ) : (
              productTree.map((node) => renderTreeNode(node))
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#081636]">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#081636]">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#081636]">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#081636]">
                    Parent
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const parent = products.find((p) => p.id === product.parent_id)
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                              product.level === 0
                                ? 'bg-blue-100 text-blue-600'
                                : product.level === 1
                                  ? 'bg-green-100 text-green-600'
                                  : product.level === 2
                                    ? 'bg-purple-100 text-purple-600'
                                    : 'bg-gray-100 text-[#081636]'
                            }`}
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                              />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-[#081636]">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#081636]">
                        {product.description || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            product.level === 0
                              ? 'bg-blue-100 text-blue-700'
                              : product.level === 1
                                ? 'bg-green-100 text-green-700'
                                : product.level === 2
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-gray-100 text-[#081636]'
                          }`}
                        >
                          Level {product.level}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-[#081636]">
                        {parent ? parent.name : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="text-sm text-[#081636]">
        Showing {searchQuery ? filteredProducts.length : products.length} products
      </div>

      {canCreateProducts && (
        <>
          <AddProductModal
            isOpen={isAddModalOpen}
            onClose={() => {
              setIsAddModalOpen(false)
              fetchProducts()
            }}
            companyId={companyId}
          />
          <BulkAddProductsModal
            isOpen={isBulkModalOpen}
            onClose={() => setIsBulkModalOpen(false)}
            companyId={companyId}
            onSuccess={() => {
              setIsBulkModalOpen(false)
              fetchProducts()
            }}
          />
        </>
      )}
    </div>
  )
}

