import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatAUD, formatPercent } from '@/lib/utils'
import type { PortfolioSummary } from '@/types'

export function NetWorthCard({ summary }: { summary: PortfolioSummary }) {
  const isPositive = summary.dayChangeAUD >= 0

  return (
    <div className="col-span-full rounded-2xl p-8 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, hsl(246 83% 50%) 0%, hsl(265 83% 55%) 50%, hsl(280 70% 50%) 100%)',
        boxShadow: '0 20px 60px hsl(246 83% 50% / 0.35)',
      }}>
      {/* Decorative circles */}
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-10"
        style={{ background: 'white' }} />
      <div className="absolute -right-4 -bottom-8 h-32 w-32 rounded-full opacity-10"
        style={{ background: 'white' }} />

      <div className="relative">
        <p className="text-sm font-medium text-white/70 mb-2 uppercase tracking-widest">Total Net Worth</p>
        <div className="flex items-end gap-4 flex-wrap">
          <h2 className="text-5xl font-bold tracking-tight text-white">{formatAUD(summary.netWorthAUD)}</h2>
          {summary.dayChangePercent !== 0 && (
            <div className={`flex items-center gap-1 mb-1.5 text-sm font-semibold px-2.5 py-1 rounded-full ${isPositive ? 'bg-emerald-400/20 text-emerald-200' : 'bg-red-400/20 text-red-200'}`}>
              {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {formatPercent(summary.dayChangePercent)} today
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center gap-6">
          <div>
            <p className="text-xs text-white/60">Total Assets</p>
            <p className="text-lg font-semibold text-white">{formatAUD(summary.totalAUD)}</p>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div>
            <p className="text-xs text-white/60">Liabilities</p>
            <p className="text-lg font-semibold text-red-300">{formatAUD(summary.liabilitiesAUD)}</p>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div>
            <p className="text-xs text-white/60">Currency</p>
            <p className="text-lg font-semibold text-white">AUD</p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number
  subLabel?: string
  subValue?: string
  icon: React.ReactNode
  gradient: string
  shadowColor: string
}

export function StatCard({ label, value, subLabel, subValue, icon, gradient, shadowColor }: StatCardProps) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden transition-transform duration-200 hover:-translate-y-0.5"
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        boxShadow: '0 1px 3px hsl(0 0% 0% / 0.06)',
      }}>
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {label}
        </span>
        <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: gradient, boxShadow: `0 4px 12px ${shadowColor}` }}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight">{formatAUD(value)}</p>
        {subLabel && subValue && (
          <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {subLabel}: <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>{subValue}</span>
          </p>
        )}
      </div>
    </div>
  )
}
