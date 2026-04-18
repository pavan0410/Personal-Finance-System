'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatAUD } from '@/lib/utils'
import type { PortfolioSummary } from '@/types'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444']

export function AssetAllocationChart({ summary }: { summary: PortfolioSummary }) {
  const data = [
    { name: 'Accounts', value: summary.accountsAUD },
    { name: 'Mutual Funds', value: summary.mutualFundsAUD },
    { name: 'ETFs', value: summary.etfsAUD },
    { name: 'Super', value: summary.superAUD },
    { name: 'Real Estate', value: summary.realEstateAUD },
  ].filter((d) => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
        No assets tracked yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [formatAUD(typeof value === 'number' ? value : 0), '']}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
          }}
        />
        <Legend
          formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
