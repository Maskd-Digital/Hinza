import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles'
import { hasPermission } from '@/lib/auth/permissions'

export interface BulkImportProductsBody {
  company_id: string
  csv: string
}

export interface BulkImportProductsResult {
  created: number
  skipped: number
  failed: Array<{ line: number; path: string; reason: string }>
}

function splitCsvLine(line: string, expectedCols: number): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }

  result.push(current)

  while (result.length < expectedCols) {
    result.push('')
  }

  return result
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserWithRoles()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!hasPermission(user.permissions, 'products:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let body: BulkImportProductsBody
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const { company_id, csv } = body

    if (!company_id || typeof csv !== 'string' || !csv.trim()) {
      return NextResponse.json(
        { error: 'company_id and csv are required' },
        { status: 400 }
      )
    }

    const lines = csv
      .split(/\r?\n/)
      .map((l) => l.trimEnd())
      .filter((l) => l.trim().length > 0)

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV must include a header and at least one data row' },
        { status: 400 }
      )
    }

    const headerLine = lines[0]
    const headerCols = headerLine.split(',').map((h) => h.trim().toLowerCase())

    const idxLevel1 = headerCols.indexOf('level_1')
    const idxLevel2 = headerCols.indexOf('level_2')
    const idxLevel3 = headerCols.indexOf('level_3')
    const idxLevel4 = headerCols.indexOf('level_4')
    const idxDescription = headerCols.indexOf('description')

    if (idxLevel1 === -1) {
      return NextResponse.json(
        { error: 'CSV header must include at least level_1 column' },
        { status: 400 }
      )
    }

    const rows: Array<{ lineNumber: number; levels: string[]; description?: string }> = []

    for (let i = 1; i < lines.length; i++) {
      const rawLine = lines[i]
      if (!rawLine.trim()) continue

      const cols = splitCsvLine(rawLine, headerCols.length).map((c) => c.trim())

      const levelsRaw = [
        idxLevel1 >= 0 ? cols[idxLevel1] : '',
        idxLevel2 >= 0 ? cols[idxLevel2] : '',
        idxLevel3 >= 0 ? cols[idxLevel3] : '',
        idxLevel4 >= 0 ? cols[idxLevel4] : '',
      ]

      const levels = levelsRaw.filter((v) => v.length > 0)
      const description =
        idxDescription >= 0 && idxDescription < cols.length
          ? cols[idxDescription]
          : undefined

      if (levels.length === 0) {
        // Skip rows with no product levels
        continue
      }

      rows.push({
        lineNumber: i + 1,
        levels,
        description: description && description.length > 0 ? description : undefined,
      })
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No valid product rows found in CSV' },
        { status: 400 }
      )
    }

    // Sort rows so parents are processed before children
    rows.sort((a, b) => {
      if (a.levels.length !== b.levels.length) {
        return a.levels.length - b.levels.length
      }
      const pathA = a.levels.join(' > ')
      const pathB = b.levels.join(' > ')
      return pathA.localeCompare(pathB)
    })

    const adminClient = createAdminClient()
    const result: BulkImportProductsResult = {
      created: 0,
      skipped: 0,
      failed: [],
    }

    const pathToId = new Map<string, string>()

    for (const row of rows) {
      const path = row.levels.join(' > ')

      if (pathToId.has(path)) {
        result.skipped += 1
        continue
      }

      let parentId: string | null = null
      if (row.levels.length > 1) {
        const parentPath = row.levels.slice(0, -1).join(' > ')
        const parent = pathToId.get(parentPath)
        if (!parent) {
          result.failed.push({
            line: row.lineNumber,
            path,
            reason: `Parent path "${parentPath}" not found in this CSV. Ensure parent rows are included before children.`,
          })
          continue
        }
        parentId = parent
      }

      const name = row.levels[row.levels.length - 1]

      const insertData: Record<string, unknown> = {
        name,
        company_id,
        parent_id: parentId,
      }

      if (row.description) {
        insertData.description = row.description
      }

      const { data, error } = await adminClient
        .from('products')
        .insert(insertData)
        .select('id')
        .single()

      if (error || !data) {
        result.failed.push({
          line: row.lineNumber,
          path,
          reason: error?.message || 'Failed to create product',
        })
        continue
      }

      pathToId.set(path, data.id as string)
      result.created += 1
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Bulk import products error:', error)
    return NextResponse.json(
      { error: 'Failed to bulk import products' },
      { status: 500 }
    )
  }
}

