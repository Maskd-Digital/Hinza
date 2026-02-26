import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Complaint, FacilityLocation } from '@/types/complaint'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFacilityAddress(facilities: FacilityLocation | null | undefined): string {
  if (!facilities) return '—'
  const parts = [
    facilities.address,
    [facilities.city, facilities.state, facilities.postal_code].filter(Boolean).join(', '),
    facilities.country,
  ].filter(Boolean)
  return parts.length ? parts.join(', ') : facilities.name ?? '—'
}

export function formatFacilityName(facilities: FacilityLocation | null | undefined): string {
  if (!facilities) return '—'
  return facilities.name?.trim() || '—'
}

const PHOTO_LABEL_PATTERN = /photo|image|evidence|picture|attachment|file/i
const IMAGE_EXT_PATTERN = /\.(jpe?g|png|gif|webp|heic)(\?|$)/i

function looksLikeStoragePath(val: string): boolean {
  if (typeof val !== 'string' || val.startsWith('http://') || val.startsWith('https://')) return false
  return IMAGE_EXT_PATTERN.test(val) || val.includes('/')
}

function isPhotoField(label: string, value: string): boolean {
  if (PHOTO_LABEL_PATTERN.test(label)) return true
  const trimmed = value.trim()
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown
      if (Array.isArray(parsed) && parsed.some((x) => typeof x === 'string' && (looksLikeStoragePath(x) || x.startsWith('http'))))
        return true
    } catch {
      // not valid JSON
    }
  }
  return looksLikeStoragePath(value)
}

/** Normalize complaint custom_fields (JSON) into list of { label, value, isPhoto? } for display */
export function getCustomFieldsEntries(
  customFields: Complaint['custom_fields']
): Array<{ label: string; value: string; isPhoto?: boolean }> {
  if (customFields == null || (Array.isArray(customFields) && customFields.length === 0)) return []
  if (Array.isArray(customFields)) {
    return customFields.flatMap((item) => {
      const label = (item?.field_name ?? item?.name ?? '') as string
      const val = item?.value
      if (label == null || val == null) return []
      const valueStr =
        typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)
      return [
        {
          label: String(label).replace(/_/g, ' ').trim() || '—',
          value: valueStr,
          isPhoto: isPhotoField(String(label).replace(/_/g, ' ').trim(), valueStr),
        },
      ]
    })
  }
  return Object.entries(customFields)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => {
      const label = k.replace(/_/g, ' ').trim() || '—'
      const value = typeof v === 'object' ? JSON.stringify(v) : String(v)
      return { label, value, isPhoto: isPhotoField(label, value) }
    })
}

/** Entries for "Additional details" section: description first, then custom fields. */
export function getAdditionalDetailsEntries(
  description: string | null | undefined,
  customFields: Complaint['custom_fields']
): Array<{ label: string; value: string; isPhoto?: boolean }> {
  const entries: Array<{ label: string; value: string; isPhoto?: boolean }> = []
  if (description != null && description !== '') {
    entries.push({ label: 'Description', value: description })
  }
  entries.push(...getCustomFieldsEntries(customFields))
  return entries
}
