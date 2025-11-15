/**
 * StatsCards Component
 * Displays key metrics for admin dashboard
 * Shows: total clients, active clients, total employees, inactive clients
 */
import { Card } from '@/components/ui/card'
import { Building2, Activity, Users, XCircle } from 'lucide-react'

interface StatsCardsProps {
  totalClients: number
  activeClients: number
  totalEmployees: number
  inactiveClients: number
}

export function StatsCards({
  totalClients,
  activeClients,
  totalEmployees,
  inactiveClients
}: StatsCardsProps) {
  const stats = [
    {
      label: 'Total Clients',
      value: totalClients,
      icon: Building2,
      color: 'text-neutral-400'
    },
    {
      label: 'Active Clients',
      value: activeClients,
      icon: Activity,
      color: 'text-green-500'
    },
    {
      label: 'Total Employees',
      value: totalEmployees,
      icon: Users,
      color: 'text-neutral-400'
    },
    {
      label: 'Inactive Clients',
      value: inactiveClients,
      icon: XCircle,
      color: 'text-yellow-500'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="p-6 bg-neutral-800 border-neutral-700"
        >
          <div className="flex items-center gap-4">
            {/* Icon */}
            <stat.icon className={`w-8 h-8 ${stat.color}`} />

            {/* Label and Value */}
            <div>
              <p className="text-sm text-neutral-400">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
