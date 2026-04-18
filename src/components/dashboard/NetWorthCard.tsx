import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatAUD, formatPercent, gainLossColor } from '@/lib/utils'
import type { PortfolioSummary } from '@/types'

export function NetWorthCard({ summary }: { summary: PortfolioSummary }) {
  const isPositive = summary.dayChangeAUD >= 0

  return (
    <div className="col-span-full rounded-2xl bg-gradient-to-br from-primary/90 to-primary p-8 text-primary-foreground">
      <p className="text-sm font-medium opacity-80 mb-1">Total Net Worth</p>
      <div className="flex items-end gap-4 flex-wrap">
        <h2 className="text-5xl font-bold tracking-tight">{formatAUD(summary.netWorthAUD)}</h2>
        <div className={`flex items-center gap-1 mb-1 text-sm font-medium ${isPositive ? 'text-emerald-300' : 'text-red-300'}`}>
          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {formatPercent(summary.dayChangePercent)} today
        </div>
      </div>
      <p className="text-sm opacity-70 mt-2">All values in AUD</p>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number
  subLabel?: string
  subValue?: string
  icon: React.ReactNode
  color: string
}

export function StatCard({ label, value, subLabel, subValue, icon, color }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold">{formatAUD(value)}</p>
        {subLabel && subValue && (
          <p className="text-xs text-muted-foreground mt-0.5">{subLabel}: {subValue}</p>
        )}
      </div>
    </div>
  )
}
