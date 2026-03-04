'use client'

import { useState, useRef, useEffect } from 'react'
import Modal from '@/components/Modal'
import { Role } from '@/types/auth'
import type { BulkAssignRoleResult } from '@/app/api/users/bulk-assign-role/route'

interface BulkAddUsersModalProps {
  isOpen: boolean
  onClose: () => void
  role: Role | null
  companyId: string
  roles: Role[]
  onSuccess?: () => void
}

const CSV_TEMPLATE = 'email\nuser1@example.com\nuser2@example.com'

function parseEmailsFromText(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0 && s.includes('@'))
}

function parseCsvToEmails(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      const lines = text.split(/\r?\n/).filter((l) => l.trim())
      const emails: string[] = []
      const first = lines[0]?.toLowerCase()
      const hasHeader = first?.includes('email')
      const start = hasHeader ? 1 : 0
      for (let i = start; i < lines.length; i++) {
        const line = lines[i]
        const parts = line.split(/[,;\t]/).map((p) => p.trim())
        const email = parts[0]
        if (email && email.includes('@')) {
          emails.push(email.toLowerCase())
        }
      }
      resolve([...new Set(emails)])
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file, 'UTF-8')
  })
}

export default function BulkAddUsersModal({
  isOpen,
  onClose,
  role: initialRole,
  companyId,
  roles,
  onSuccess,
}: BulkAddUsersModalProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>(initialRole?.id ?? '')
  const [pasteText, setPasteText] = useState('')

  useEffect(() => {
    if (isOpen) {
      setSelectedRoleId(initialRole?.id ?? roles[0]?.id ?? '')
    }
  }, [isOpen, initialRole?.id, roles])
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BulkAssignRoleResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? initialRole ?? roles[0]

  const handleClose = () => {
    setPasteText('')
    setFile(null)
    setError(null)
    setResult(null)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRole) return

    const fromPaste = parseEmailsFromText(pasteText)
    let fromFile: string[] = []
    if (file) {
      try {
        fromFile = await parseCsvToEmails(file)
      } catch {
        setError('Failed to read CSV file.')
        return
      }
    }

    const identifiers = [...new Set([...fromPaste, ...fromFile])]
    if (identifiers.length === 0) {
      setError('Enter at least one email (paste or upload CSV).')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/users/bulk-assign-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          role_id: selectedRole.id,
          identifiers,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Bulk assign failed')
        setLoading(false)
        return
      }

      setResult(data as BulkAssignRoleResult)
      if (data.added > 0 && onSuccess) onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bulk-add-users-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk add users to role"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[#081636]">
            Role <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-[#081636] shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            required
          >
            <option value="">Select role</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#081636]">
            Emails (paste or CSV)
          </label>
          <p className="mt-1 text-xs text-gray-500">
            One email per line, or comma/semicolon separated. You can also upload a CSV with an &quot;email&quot; column.
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={'user1@company.com\nuser2@company.com'}
            rows={5}
            className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-[#081636] shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#081636]">
            Or upload CSV
          </label>
          <div className="mt-2 flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
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
              <li>Added: {result.added}</li>
              <li>Skipped (already had role): {result.skipped}</li>
              <li>Failed: {result.failed.length}</li>
            </ul>
            {result.failed.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto rounded border border-gray-200 bg-white p-2 text-xs">
                {result.failed.map((f, i) => (
                  <div key={i} className="text-red-700">
                    {f.identifier}: {f.reason}
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
              disabled={loading || !selectedRoleId}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add users to role'}
            </button>
          )}
        </div>
      </form>
    </Modal>
  )
}
