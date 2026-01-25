'use client'

interface HorizontalBarChartProps {
  data: Array<{
    label: string
    value: number
    color?: string
  }>
  title?: string
  showValues?: boolean
}

export default function HorizontalBarChart({
  data,
  title,
  showValues = true,
}: HorizontalBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1)
  
  const defaultColors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
  ]
  
  return (
    <div className="w-full">
      {title && (
        <h4 className="mb-4 text-sm font-medium text-gray-700">{title}</h4>
      )}
      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100
          const color = item.color || defaultColors[index % defaultColors.length]
          
          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 truncate max-w-[70%]">
                  {item.label}
                </span>
                {showValues && (
                  <span className="text-sm font-medium text-gray-900">
                    {item.value}
                  </span>
                )}
              </div>
              <div className="h-3 w-full rounded-full bg-gray-100">
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
