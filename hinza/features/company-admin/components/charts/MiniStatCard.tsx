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
    bg: 'bg-white',
    icon: 'bg-blue-100 text-blue-600',
    value: 'text-blue-600',
  },
  green: {
    bg: 'bg-white',
    icon: 'bg-green-100 text-green-600',
    value: 'text-green-600',
  },
  red: {
    bg: 'bg-white',
    icon: 'bg-red-100 text-red-600',
    value: 'text-red-600',
  },
  purple: {
    bg: 'bg-white',
    icon: 'bg-purple-100 text-purple-600',
    value: 'text-purple-600',
  },
  amber: {
    bg: 'bg-white',
    icon: 'bg-amber-100 text-amber-600',
    value: 'text-amber-600',
  },
  gray: {
    bg: 'bg-white',
    icon: 'bg-gray-100 text-[#081636]',
    value: 'text-[#081636]',
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
    <div className={`h-full min-h-[120px] rounded-xl p-6 ${colors.bg} ${onClick ? 'cursor-pointer transition-shadow hover:opacity-95' : ''}`} style={{ boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)' }}>
      <div className="flex h-full items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[#081636] uppercase tracking-wide">
            {title}
          </p>
          <p className={`mt-2 text-2xl font-bold ${colors.value}`}>{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-[#081636]">{subtitle}</p>
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
          <div className={`flex-shrink-0 rounded-lg p-3 ${colors.icon}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
  
  if (onClick) {
    return (
      <button onClick={onClick} className="h-full w-full text-left">
        {content}
      </button>
    )
  }
  
  return <div className="h-full w-full">{content}</div>
}
