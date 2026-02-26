import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_COMPLAINTS_BUCKET ?? 'complaints'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

/** Normalize storage path: trim and remove leading slash (Supabase expects no leading slash). */
function normalizePath(path: string): string {
  return path.trim().replace(/^\/+/, '') || ''
}

/** Public URL for direct access (when bucket is public). */
function getPublicPhotoUrl(objectPath: string): string {
  if (!SUPABASE_URL) return ''
  const base = SUPABASE_URL.replace(/\/$/, '')
  const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/')
  return `${base}/storage/v1/object/public/${BUCKET}/${encodedPath}`
}

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path')
  if (!path) {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 })
  }

  const objectPath = normalizePath(path)
  if (!objectPath) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY

  if (hasServiceRole) {
    try {
      const supabase = createAdminClient()
      const { data, error } = await supabase.storage.from(BUCKET).download(objectPath)

      if (error) {
        console.error('[storage/photo]', error.message, { path: objectPath })
        const publicUrl = getPublicPhotoUrl(objectPath)
        if (publicUrl) return NextResponse.redirect(publicUrl, 302)
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }

      if (!data) {
        const publicUrl = getPublicPhotoUrl(objectPath)
        if (publicUrl) return NextResponse.redirect(publicUrl, 302)
        return NextResponse.json({ error: 'No data' }, { status: 404 })
      }

      const contentType = data.type ?? 'image/jpeg'
      return new NextResponse(data, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'private, max-age=3600',
        },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load photo'
      console.error('[storage/photo]', message)
      const publicUrl = getPublicPhotoUrl(objectPath)
      if (publicUrl) return NextResponse.redirect(publicUrl, 302)
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  // No service role: redirect to public URL (bucket must be public + policy allows read)
  const publicUrl = getPublicPhotoUrl(objectPath)
  if (publicUrl) {
    return NextResponse.redirect(publicUrl, 302)
  }
  return NextResponse.json({ error: 'Storage not configured' }, { status: 503 })
}
