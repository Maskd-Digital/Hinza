'use client'

interface TimelineData {
  date: string
  count: number
}

interface ComplaintsTimelineProps {
  data: TimelineData[]
}

export default function ComplaintsTimeline({
  data,
}: ComplaintsTimelineProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)
  const chartHeight = 200

  return (
    <div className="w-full">
      {data.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-[#081636]">
          <p>No complaints data available</p>
        </div>
      ) : (
        <div className="relative">
          {/* Chart Bars */}
          <div className="flex h-48 items-end justify-between gap-1">
            {data.map((item, index) => {
              const height = (item.count / maxCount) * chartHeight
              const date = new Date(item.date)
              const dayLabel = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })

              return (
                <div
                  key={index}
                  className="group relative flex flex-1 flex-col items-center"
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden rounded-md bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
                    <div className="font-semibold">{item.count} complaints</div>
                    <div className="text-gray-300">{dayLabel}</div>
                    <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>

                  {/* Bar */}
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-blue-600 to-blue-400 transition-all hover:from-blue-700 hover:to-blue-500"
                    style={{
                      height: `${Math.max(height, 4)}px`,
                      minHeight: item.count > 0 ? '4px' : '0px',
                    }}
                    title={`${item.count} complaints on ${dayLabel}`}
                  />

                  {/* Date Label */}
                  {index % 5 === 0 && (
                    <div className="mt-2 text-xs text-[#081636]">
                      {dayLabel}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Y-axis labels */}
          <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-2">
            <span className="text-xs text-[#081636]">0</span>
            <span className="text-xs text-[#081636]">
              Max: {maxCount} complaints
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
