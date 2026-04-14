'use client'

import { useState, useRef } from 'react'
import Modal from '@/components/Modal'
import type { BulkImportProductsResult } from '@/app/api/products/bulk-import/route'

interface BulkAddProductsModalProps {
  isOpen: boolean
  onClose: () => void
  companyId: string
  onSuccess?: () => void
}

const PRODUCTS_CSV_TEMPLATE =
  'level_1,level_2,level_3,level_4,description\n' +
  'Beverages,Soft Drinks,,,"All non-alcoholic soft drinks"\n' +
  'Beverages,Soft Drinks,Cola,,Classic cola drinks\n' +
  'Beverages,Soft Drinks,Lemonade,,Citrus-flavoured drinks\n' +
  'Beverages,Juices,Orange Juice,,Fresh orange juice products\n' +
  'Beverages,Juices,Apple Juice,,Apple-based juice products\n' +
  'Snacks,Chips,Potato Chips,,Potato-based chips\n' +
  'Snacks,Chips,Tortilla Chips,,Corn-based chips\n' +
  'Snacks,Biscuits,Chocolate Biscuits,,Chocolate-coated biscuits\n'

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file, 'UTF-8')
  })
}

export default function BulkAddProductsModal({
  isOpen,
  onClose,
  companyId,
  onSuccess,
}: BulkAddProductsModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BulkImportProductsResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClose = () => {
    setFile(null)
    setError(null)
    setResult(null)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a CSV file.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const csv = await readFileAsText(file)

      const res = await fetch('/api/products/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          csv,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Bulk import failed')
        setLoading(false)
        return
      }

      setResult(data as BulkImportProductsResult)
      if (data.created > 0 && onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read or upload CSV.')
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const blob = new Blob([PRODUCTS_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bulk-products-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk upload products"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div>
          <p className="text-sm text-[#081636]">
            Upload a CSV file to create products in a hierarchical structure. Each row defines a
            product at the deepest non-empty level.
          </p>
          <ul className="mt-2 list-inside list-disc text-xs text-gray-600">
            <li>
              <span className="font-semibold">level_1</span>: Top-level category (root product)
            </li>
            <li>
              <span className="font-semibold">level_2</span>: Child of level_1
            </li>
            <li>
              <span className="font-semibold">level_3</span>: Child of level_2
            </li>
            <li>
              <span className="font-semibold">level_4</span>: Child of level_3
            </li>
            <li>
              <span className="font-semibold">description</span>: Optional description for the
              deepest product in that row
            </li>
            <li>
              Parents must appear in the CSV before their children (e.g. create levels 1 and 2
              before level 3).
            </li>
          </ul>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#081636]">
            CSV file
          </label>
          <div className="mt-2 flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="block w-full max-w-xs text-sm text-[#081636] file:mr-2 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={downloadTemplate}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-[#081636] hover:bg-gray-50"
            >
              Download template
            </button>
          </div>
          {file && (
            <p className="mt-1 text-xs text-gray-500">
              Selected: {file.name}
            </p>
          )}
        </div>

        {result && (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium text-[#081636]">Result</p>
            <ul className="mt-2 list-inside list-disc text-sm text-[#081636]">
              <li>Created: {result.created}</li>
              <li>Skipped (duplicate paths in CSV): {result.skipped}</li>
              <li>Failed: {result.failed.length}</li>
            </ul>
            {result.failed.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto rounded border border-gray-200 bg-white p-2 text-xs">
                {result.failed.map((f, i) => (
                  <div key={i} className="text-red-700">
                    Line {f.line} ({f.path}): {f.reason}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#081636] hover:bg-gray-50"
            disabled={loading}
          >
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              type="submit"
              disabled={loading || !file}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload CSV'}
            </button>
          )}
        </div>
      </form>
    </Modal>
  )
}

