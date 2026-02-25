'use client'

interface ComplaintsTimelineProps {
  timeline: Array<{
    date: string
    count: number
  }>
}

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
      <div className="mt-4">
        <div className="flex items-end justify-between gap-1">
          {timeline.map((item, index) => {
            const height = (item.count / maxCount) * 100
            return (
              <div
                key={index}
                className="flex flex-1 flex-col items-center"
                title={`${item.date}: ${item.count} complaints`}
              >
                <div
                  className="w-full rounded-t transition-all hover:opacity-90"
                  style={{ height: `${Math.max(height, 5)}%`, backgroundColor: '#2563EB' }}
                />
                <p className="mt-2 text-xs text-[#081636]">
                  {new Date(item.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
