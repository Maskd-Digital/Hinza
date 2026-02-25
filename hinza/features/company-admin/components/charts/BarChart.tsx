'use client'

interface BarChartProps {
  data: Array<{
    label: string
    value: number
    color?: string
  }>
  title?: string
  showLabels?: boolean
  maxBars?: number
  height?: number
}

export default function BarChart({
  data,
  title,
  showLabels = true,
  maxBars,
  height = 200,
}: BarChartProps) {
  const displayData = maxBars ? data.slice(-maxBars) : data
  const maxValue = Math.max(...displayData.map((d) => d.value), 1)
  
  return (
    <div className="w-full">
      {title && (
        <h4 className="mb-4 text-sm font-medium text-gray-700">{title}</h4>
      )}
      <div className="flex items-end gap-1" style={{ height }}>
        {displayData.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100
          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center justify-end"
            >
              <div
                className="w-full rounded-t transition-all duration-300 hover:opacity-80"
                style={{
                  height: `${Math.max(barHeight, 2)}%`,
                  backgroundColor: item.color || '#3b82f6',
                }}
                title={`${item.label}: ${item.value}`}
              />
              {showLabels && (
                <span className="mt-1 text-[10px] text-[#081636] truncate w-full text-center">
                  {item.label}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
