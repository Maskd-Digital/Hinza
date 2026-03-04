import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_COMPLAINTS_BUCKET ?? 'complaints'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

function getPublicDocumentUrl(objectPath: string): string {
  if (!SUPABASE_URL) return ''
  const base = SUPABASE_URL.replace(/\/$/, '')
  const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/')
  return `${base}/storage/v1/object/public/${BUCKET}/${encodedPath}`
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100) || 'document'
}

interface RouteParams {
  params: Promise<{ id: string }>
}

/** GET /api/complaints/[id]/documents - List document versions for complaint */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: complaintId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    const { data: complaint, error: complaintError } = await adminClient
      .from('complaints')
      .select('id, company_id')
      .eq('id', complaintId)
      .single()

    if (complaintError || !complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    const { data: userRow } = await adminClient
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!userRow || userRow.company_id !== complaint.company_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const typeFilter = searchParams.get('type')

    let query = adminClient
      .from('complaint_documents')
      .select('id, complaint_id, document_type, file_path, file_name, uploaded_at, uploaded_by')
      .eq('complaint_id', complaintId)
      .order('uploaded_at', { ascending: false })

    if (typeFilter === 'capa' || typeFilter === 'sla') {
      query = query.eq('document_type', typeFilter)
    }

    const { data: docs, error } = await query

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch documents: ${error.message}` },
        { status: 500 }
      )
    }

    const uploaderIds = [...new Set((docs || []).map((d) => d.uploaded_by).filter(Boolean) as string[])]
    let uploadersMap: Record<string, { full_name: string | null; email: string | null }> = {}
    if (uploaderIds.length > 0) {
      const { data: users } = await adminClient
        .from('users')
        .select('id, full_name, email')
        .in('id', uploaderIds)
      uploadersMap = (users || []).reduce(
        (acc, u) => {
          acc[u.id] = { full_name: u.full_name, email: u.email }
          return acc
        },
        {} as Record<string, { full_name: string | null; email: string | null }>
      )
    }

    const withUploader = (docs || []).map((d) => ({
      ...d,
      uploader: d.uploaded_by ? uploadersMap[d.uploaded_by] ?? null : null,
    }))

    return NextResponse.json(withUploader)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/** POST /api/complaints/[id]/documents - Upload new document version (multipart: file + document_type) */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: complaintId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    const { data: complaint, error: complaintError } = await adminClient
      .from('complaints')
      .select('id, company_id')
      .eq('id', complaintId)
      .single()

    if (complaintError || !complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    const { data: userRow } = await adminClient
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!userRow || userRow.company_id !== complaint.company_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const documentType = (formData.get('document_type') as string)?.toLowerCase()

    if (!file || !documentType) {
      return NextResponse.json(
        { error: 'file and document_type are required' },
        { status: 400 }
      )
    }

    if (documentType !== 'capa' && documentType !== 'sla') {
      return NextResponse.json(
        { error: 'document_type must be capa or sla' },
        { status: 400 }
      )
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const safeName = sanitizeFileName(file.name || 'document')
    const ext = file.name?.split('.').pop()?.slice(0, 10) || 'bin'
    const storagePath = `${complaint.company_id}/${complaintId}/${documentType}/${timestamp}_${safeName}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await adminClient.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      console.error('Document upload error:', uploadError)
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    const documentUrl = getPublicDocumentUrl(storagePath)

    const { data: docRow, error: insertError } = await adminClient
      .from('complaint_documents')
      .insert({
        complaint_id: complaintId,
        document_type: documentType,
        file_path: storagePath,
        file_name: file.name || null,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: `Failed to save document record: ${insertError.message}` },
        { status: 500 }
      )
    }

    const updatePayload: Record<string, unknown> = {}
    if (documentType === 'capa') {
      updatePayload.capa_document_url = documentUrl
      updatePayload.capa_verified_at = null
    } else {
      updatePayload.sla_document_url = documentUrl
      updatePayload.sla_verified_at = null
    }

    const { data: updatedComplaint, error: updateError } = await adminClient
      .from('complaints')
      .update(updatePayload)
      .eq('id', complaintId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update complaint: ${updateError.message}` },
        { status: 500 }
      )
    }

    const { data: uploader } = await adminClient
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      document: {
        ...docRow,
        uploader: uploader ? { full_name: uploader.full_name, email: uploader.email } : null,
      },
      complaint: updatedComplaint,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
