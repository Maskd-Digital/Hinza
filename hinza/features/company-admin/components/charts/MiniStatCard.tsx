'use client'

interface MiniStatCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'red' | 'purple' | 'amber' | 'gray'
  trend?: {
    value: number
    isPositive: boolean
  }
  onClick?: () => void
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-600',
    value: 'text-blue-600',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'bg-green-100 text-green-600',
    value: 'text-green-600',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-100 text-red-600',
    value: 'text-red-600',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-100 text-purple-600',
    value: 'text-purple-600',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'bg-amber-100 text-amber-600',
    value: 'text-amber-600',
  },
  gray: {
    bg: 'bg-gray-50',
    icon: 'bg-gray-100 text-gray-600',
    value: 'text-gray-600',
  },
}

export default function MiniStatCard({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
  trend,
  onClick,
}: MiniStatCardProps) {
  const colors = colorClasses[color]
  
  const content = (
    <div className={`rounded-xl p-4 ${colors.bg} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {title}
          </p>
          <p className={`mt-1 text-2xl font-bold ${colors.value}`}>{value}</p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <p
              className={`mt-1 text-xs font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}% from last period
            </p>
          )}
        </div>
        {icon && (
          <div className={`ml-3 flex-shrink-0 rounded-lg p-2 ${colors.icon}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
  
  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left">
        {content}
      </button>
    )
  }
  
  return content
}
