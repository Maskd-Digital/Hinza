'use client'

import { useState } from 'react'
import { getAdditionalDetailsEntries } from '@/lib/utils'
import type { Complaint } from '@/types/complaint'

export interface ComplaintAdditionalDetailsProps {
  description: string | null | undefined
  customFields: Complaint['custom_fields']
}

/** Parse photo field value into one or more paths (handles JSON array or single string). */
function parsePhotoPaths(value: string): string[] {
  const trimmed = value.trim()
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown
      if (Array.isArray(parsed)) {
        return parsed.filter((x): x is string => typeof x === 'string' && x.length > 0)
      }
    } catch {
      // fallback: treat as single path
    }
  }
  return trimmed ? [trimmed] : []
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') ?? ''
const STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_COMPLAINTS_BUCKET ?? 'complaints'

/** True if the value is already a full URL (e.g. stored public URL from DB). Use directly as img src. */
function isPublicUrl(pathOrUrl: string): boolean {
  const p = pathOrUrl.trim()
  return p.startsWith('http://') || p.startsWith('https://')
}

/** Build URL for photo: use stored public URL as-is; otherwise build Supabase public URL or proxy. */
function getPhotoUrl(pathOrUrl: string): string {
  if (isPublicUrl(pathOrUrl)) return pathOrUrl.trim()
  const path = pathOrUrl.trim().replace(/^\/+/, '')
  if (SUPABASE_URL) {
    const encodedPath = path.split('/').map(encodeURIComponent).join('/')
    return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${encodedPath}`
  }
  return `/api/storage/photo?path=${encodeURIComponent(path)}`
}

/** True if path is local device path (not loadable as URL in browser). */
function isLocalDevicePath(path: string): boolean {
  const p = path.trim()
  return p.startsWith('/data/') || p.startsWith('file://') || p.startsWith('content://')
}

/** For local paths, try Supabase with just the filename (in case file was uploaded with same name). */
function getStorageKeyForDisplay(path: string): string {
  if (isLocalDevicePath(path)) {
    const filename = path.split('/').pop() ?? path.trim()
    return filename || path
  }
  return path.trim().replace(/^\/+/, '')
}

export default function ComplaintAdditionalDetails({
  description,
  customFields,
}: ComplaintAdditionalDetailsProps) {
  const [expanded, setExpanded] = useState(false)
  const entries = getAdditionalDetailsEntries(description, customFields)
  if (entries.length === 0) return null

  return (
    <div
      className="rounded-lg bg-white p-4"
      style={{ color: '#000', boxShadow: '0 2px 4px rgba(1, 8, 184, 0.1)' }}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between py-2 text-left text-sm font-bold uppercase tracking-wider focus:outline-none focus:ring-0"
        style={{ color: '#000' }}
        aria-expanded={expanded}
      >
        Additional details
        <span className="text-lg leading-none" aria-hidden>
          {expanded ? '−' : '+'}
        </span>
      </button>
      {expanded && (
        <div className="space-y-4 pt-2">
          {entries.map(({ label, value, isPhoto }, index) => (
            <div
              key={`${label}-${index}`}
              className="rounded-lg bg-gray-50/80 p-3"
              style={{ color: '#000', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.12)' }}
            >
              <dt className="text-xs font-semibold uppercase tracking-wide opacity-90" style={{ color: '#000' }}>
                {label}
              </dt>
              <dd className="mt-1.5">
                {isPhoto ? (
                  <div className="mt-2 space-y-3">
                    {parsePhotoPaths(value).map((path, pathIndex) => {
                      // Photo is stored as public URL in DB — use directly as img src when possible
                      const storageKey = getStorageKeyForDisplay(path)
                      const photoUrl = isPublicUrl(path)
                        ? path.trim()
                        : getPhotoUrl(storageKey)
                      return (
                        <div key={pathIndex} className="relative">
                          <img
                            src={photoUrl}
                            alt={`${label} ${pathIndex + 1}`}
                            className="max-h-64 w-auto rounded-lg object-contain"
                            onError={(e) => {
                              const target = e.currentTarget
                              target.style.display = 'none'
                              const fallback = target.nextElementSibling as HTMLElement | null
                              if (fallback) {
                                fallback.style.display = 'block'
                                fallback.classList.remove('hidden')
                              }
                            }}
                          />
                          <div className="mt-1 hidden text-sm" style={{ color: '#000' }} data-fallback>
                            <p className="font-medium text-amber-700">Image couldn’t be loaded</p>
                            <p className="mt-0.5 break-all text-xs font-mono opacity-90" title={photoUrl}>
                              Tried URL: {photoUrl}
                            </p>
                            {path !== storageKey && (
                              <p className="mt-0.5 break-all text-xs opacity-70" title={path}>
                                From data: {path}
                              </p>
                            )}
                            <p className="mt-1 break-all text-xs opacity-80">
                              The complaint stores the filename as <span className="font-mono">{storageKey}</span>. In Supabase the file may use a timestamp prefix (e.g. <span className="font-mono">1772007309618_1000000033.jpg</span>). Save the <strong>full object name</strong> from Supabase in the complaint’s photo field so the URL matches.
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap break-words" style={{ color: '#000' }}>
                    {value}
                  </p>
                )}
              </dd>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
