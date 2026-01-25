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
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
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
          <div className="rounded-full bg-blue-100 p-3 text-blue-600">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
