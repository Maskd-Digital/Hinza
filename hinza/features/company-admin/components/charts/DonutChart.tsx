'use client'

interface DonutChartProps {
  data: Array<{
    label: string
    value: number
    color: string
  }>
  centerLabel?: string
  centerValue?: string | number
  size?: number
}

export default function DonutChart({
  data,
  centerLabel,
  centerValue,
  size = 200,
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const strokeWidth = 30
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  
  let currentOffset = 0
  
  if (total === 0) {
    return (
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[#081636]">0</span>
          <span className="text-xs text-gray-500">{centerLabel || 'Total'}</span>
        </div>
      </div>
    )
  }
  
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        {data.map((item, index) => {
          const percentage = item.value / total
          const strokeDasharray = `${percentage * circumference} ${circumference}`
          const strokeDashoffset = -currentOffset * circumference
          currentOffset += percentage
          
          return (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-300"
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-[#081636]">
          {centerValue !== undefined ? centerValue : total}
        </span>
        <span className="text-xs text-gray-500">{centerLabel || 'Total'}</span>
      </div>
    </div>
  )
}
