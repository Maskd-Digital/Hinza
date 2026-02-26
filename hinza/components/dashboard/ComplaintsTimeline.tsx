'use client'

interface ComplaintsTimelineProps {
  timeline: Array<{
    date: string
    count: number
  }>
}

const CHART_HEIGHT = 200
const PADDING = { top: 12, right: 12, bottom: 28, left: 32 }

export default function ComplaintsTimeline({
  timeline,
}: ComplaintsTimelineProps) {
  if (timeline.length === 0) {
    return (
      <div
        className="rounded-lg border border-gray-200 p-6"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.25), 0 2px 6px -2px rgba(37, 99, 235, 0.25)',
        }}
      >
        <h3 className="text-lg font-semibold text-[#081636]">
          Complaints Timeline
        </h3>
        <p className="mt-4 text-sm text-[#081636]">
          No complaints data available for the last 30 days.
        </p>
      </div>
    )
  }

  const maxCount = Math.max(...timeline.map((item) => item.count), 1)
  const width = 640
  const height = CHART_HEIGHT
  const chartWidth = width - PADDING.left - PADDING.right
  const chartHeight = height - PADDING.top - PADDING.bottom

  const points = timeline.map((item, index) => {
    const x = PADDING.left + (index / Math.max(timeline.length - 1, 1)) * chartWidth
    const y = PADDING.top + chartHeight - (item.count / maxCount) * chartHeight
    return { x, y, ...item }
  })

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  // X-axis labels: show ~6 dates (e.g. every 5th point)
  const xLabelStep = Math.max(1, Math.floor(timeline.length / 6))
  const xLabels = timeline.filter((_, i) => i % xLabelStep === 0 || i === timeline.length - 1)

  return (
    <div
      className="rounded-lg border border-gray-200 p-6"
      style={{
        backgroundColor: '#FFFFFF',
        boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.25), 0 2px 6px -2px rgba(37, 99, 235, 0.25)',
      }}
    >
      <h3 className="text-lg font-semibold text-[#081636]">
        Complaints Timeline (Last 30 Days)
      </h3>
      <div className="mt-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          style={{ minHeight: CHART_HEIGHT }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Y-axis line */}
          <line
            x1={PADDING.left}
            y1={PADDING.top}
            x2={PADDING.left}
            y2={PADDING.top + chartHeight}
            stroke="#E5E7EB"
            strokeWidth="1"
          />
          {/* Y-axis labels */}
          <text
            x={PADDING.left - 8}
            y={PADDING.top + chartHeight + 4}
            textAnchor="end"
            className="fill-[#6B7280] text-[10px]"
          >
            0
          </text>
          <text
            x={PADDING.left - 8}
            y={PADDING.top + 4}
            textAnchor="end"
            className="fill-[#6B7280] text-[10px]"
          >
            {maxCount}
          </text>
          {/* Line path */}
          <path
            d={pathD}
            fill="none"
            stroke="#2563EB"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Data points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={p.count > 0 ? 4 : 0}
              fill="#2563EB"
              className="hover:opacity-80"
            >
              <title>{`${new Date(p.date).toLocaleDateString('en-US')}: ${p.count} complaint${p.count !== 1 ? 's' : ''}`}</title>
            </circle>
          ))}
          {/* X-axis labels */}
          {xLabels.map((item, i) => {
            const index = timeline.findIndex((t) => t.date === item.date)
            const x = PADDING.left + (index / Math.max(timeline.length - 1, 1)) * chartWidth
            return (
              <text
                key={item.date}
                x={x}
                y={height - 6}
                textAnchor="middle"
                className="fill-[#6B7280] text-[10px]"
              >
                {new Date(item.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
