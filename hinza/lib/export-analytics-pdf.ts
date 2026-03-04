import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { CompanyAdminStats } from '@/app/api/company-admin/stats/route'

const FONT_SIZE_TITLE = 18
const FONT_SIZE_HEADING = 14
const FONT_SIZE_NORMAL = 10
const MARGIN = 20
const PAGE_WIDTH = 210
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

export function exportAnalyticsToPdf(stats: CompanyAdminStats, companyName: string): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  let y = MARGIN

  const addHeading = (text: string, size = FONT_SIZE_HEADING) => {
    if (y > 260) {
      doc.addPage()
      y = MARGIN
    }
    doc.setFontSize(size)
    doc.setFont('helvetica', 'bold')
    doc.text(text, MARGIN, y)
    y += size * 0.8
  }

  const addBody = (text: string) => {
    if (y > 270) {
      doc.addPage()
      y = MARGIN
    }
    doc.setFontSize(FONT_SIZE_NORMAL)
    doc.setFont('helvetica', 'normal')
    doc.text(text, MARGIN, y)
    y += 6
  }

  // Title
  doc.setFontSize(FONT_SIZE_TITLE)
  doc.setFont('helvetica', 'bold')
  doc.text('Analytics Report', MARGIN, y)
  y += 8
  doc.setFontSize(FONT_SIZE_NORMAL)
  doc.setFont('helvetica', 'normal')
  doc.text(companyName, MARGIN, y)
  y += 5
  doc.text(`Generated on ${new Date().toLocaleString()}`, MARGIN, y)
  y += 12

  // Complaint metrics (KPIs)
  addHeading('Complaints overview')
  const m = stats.complaintMetrics
  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: [
      ['Open backlog (pending + in progress)', String(m.openBacklog)],
      ['Overdue (past deadline)', String(m.overdue)],
      ['Resolved in last 30 days', String(m.resolvedLast30Days)],
      ['Average resolution time (days)', m.avgResolutionDays != null ? String(m.avgResolutionDays) : '—'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [1, 8, 184] },
    margin: { left: MARGIN },
    tableWidth: CONTENT_WIDTH,
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  // Complaints by status
  addHeading('Complaints by status')
  autoTable(doc, {
    startY: y,
    head: [['Status', 'Count']],
    body: [
      ['Pending', String(stats.complaintsByStatus.pending)],
      ['In progress', String(stats.complaintsByStatus.in_progress)],
      ['Resolved', String(stats.complaintsByStatus.resolved)],
      ['Closed', String(stats.complaintsByStatus.closed)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [1, 8, 184] },
    margin: { left: MARGIN },
    tableWidth: CONTENT_WIDTH,
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  // Complaints by priority
  if (stats.complaintsByPriority.length > 0) {
    addHeading('Complaints by priority')
    autoTable(doc, {
      startY: y,
      head: [['Priority', 'Count']],
      body: stats.complaintsByPriority.map((p) => [
        p.priority === 'unset' ? 'Unset' : p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
        String(p.count),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [1, 8, 184] },
      margin: { left: MARGIN },
      tableWidth: CONTENT_WIDTH,
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  }

  // Complaints by type (template)
  if (stats.complaintsByTemplate.length > 0) {
    addHeading('Complaints by type (top 10)')
    autoTable(doc, {
      startY: y,
      head: [['Type', 'Count']],
      body: stats.complaintsByTemplate.slice(0, 10).map((t) => [t.template_name, String(t.count)]),
      theme: 'grid',
      headStyles: { fillColor: [1, 8, 184] },
      margin: { left: MARGIN },
      tableWidth: CONTENT_WIDTH,
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  }

  // Complaints by product
  if (stats.complaintsByProduct.length > 0) {
    addHeading('Complaints by product (top 10)')
    autoTable(doc, {
      startY: y,
      head: [['Product', 'Count']],
      body: stats.complaintsByProduct.slice(0, 10).map((p) => [p.product_name, String(p.count)]),
      theme: 'grid',
      headStyles: { fillColor: [1, 8, 184] },
      margin: { left: MARGIN },
      tableWidth: CONTENT_WIDTH,
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  }

  // Complaints by facility
  if (stats.complaintsByFacility.length > 0) {
    addHeading('Complaints by facility (top 10)')
    autoTable(doc, {
      startY: y,
      head: [['Facility', 'Count']],
      body: stats.complaintsByFacility.slice(0, 10).map((f) => [f.facility_name, String(f.count)]),
      theme: 'grid',
      headStyles: { fillColor: [1, 8, 184] },
      margin: { left: MARGIN },
      tableWidth: CONTENT_WIDTH,
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  }

  // Aging of open complaints
  if (stats.complaintsAging.some((a) => a.count > 0)) {
    addHeading('Aging of open complaints')
    autoTable(doc, {
      startY: y,
      head: [['Age bucket', 'Count']],
      body: stats.complaintsAging.map((a) => [a.label, String(a.count)]),
      theme: 'grid',
      headStyles: { fillColor: [1, 8, 184] },
      margin: { left: MARGIN },
      tableWidth: CONTENT_WIDTH,
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  }

  // Resolution time distribution
  if (stats.resolutionTimeBuckets.some((b) => b.count > 0)) {
    addHeading('Resolution time distribution')
    autoTable(doc, {
      startY: y,
      head: [['Time to resolve', 'Count']],
      body: stats.resolutionTimeBuckets.map((b) => [b.label, String(b.count)]),
      theme: 'grid',
      headStyles: { fillColor: [1, 8, 184] },
      margin: { left: MARGIN },
      tableWidth: CONTENT_WIDTH,
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  }

  // Timeline summary (last 30 days)
  addHeading('Last 30 days summary')
  const opened30 = stats.complaintsTimeline.reduce((s, d) => s + d.count, 0)
  const resolved30 = stats.complaintsTimelineResolved.reduce((s, d) => s + d.count, 0)
  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Count']],
    body: [
      ['Complaints opened (last 30 days)', String(opened30)],
      ['Complaints resolved/closed (last 30 days)', String(resolved30)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [1, 8, 184] },
    margin: { left: MARGIN },
    tableWidth: CONTENT_WIDTH,
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  // Users & roles summary
  addHeading('Users and roles')
  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: [
      ['Total users', String(stats.usersCount)],
      ['Active users', String(stats.activeUsersCount)],
      ['Inactive users', String(stats.inactiveUsersCount)],
      ['Roles', String(stats.rolesCount)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [1, 8, 184] },
    margin: { left: MARGIN },
    tableWidth: CONTENT_WIDTH,
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  if (stats.usersByRole.length > 0) {
    addBody('Users by role:')
    autoTable(doc, {
      startY: y,
      head: [['Role', 'Count']],
      body: stats.usersByRole.map((r) => [r.role_name, String(r.count)]),
      theme: 'grid',
      headStyles: { fillColor: [80, 80, 80] },
      margin: { left: MARGIN },
      tableWidth: CONTENT_WIDTH,
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  }

  // Save
  const filename = `analytics-${companyName.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}
