interface StatCardProps {
  title: string
  value: number | string
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
}

export default function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <div
      className="rounded-lg border border-gray-200 p-6"
      style={{
        backgroundColor: '#FFFFFF',
        boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.25), 0 2px 6px -2px rgba(37, 99, 235, 0.25)',
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#081636]">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-[#081636]">{value}</p>
          {trend && (
            <p
              className={`mt-2 text-sm ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}% from last period
            </p>
          )}
        </div>
        {icon && (
          <div className="rounded-full p-3" style={{ backgroundColor: 'rgba(37, 99, 235, 0.15)', color: '#2563EB' }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
