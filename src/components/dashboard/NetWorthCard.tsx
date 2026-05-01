import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatAUD, formatPercent } from '@/lib/utils'
import type { PortfolioSummary } from '@/types'

export function NetWorthCard({ summary }: { summary: PortfolioSummary }) {
  const isPositive = summary.dayChangeAUD >= 0

  return (
    <div className="col-span-full rounded-2xl p-8 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 45%, #9333ea 80%, #a21caf 100%)',
        boxShadow: '0 20px 60px rgba(99,102,241,0.4), 0 4px 16px rgba(0,0,0,0.3)',
      }}>
      {/* Decorative orbs */}
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)' }} />
      <div className="absolute right-12 bottom-0 h-40 w-40 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)' }} />
      <div className="absolute -left-8 -bottom-8 h-36 w-36 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)' }} />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

      <div className="relative">
        <p className="text-xs font-semibold text-white/60 mb-3 uppercase tracking-[0.2em]">Total Net Worth</p>
        <div className="flex items-end gap-4 flex-wrap">
          <h2 className="text-5xl font-black tracking-tight text-white">{formatAUD(summary.netWorthAUD)}</h2>
          {summary.dayChangePercent !== 0 && (
            <div className={`flex items-center gap-1.5 mb-2 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm ${
              isPositive
                ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30'
                : 'bg-red-400/20 text-red-200 border border-red-400/30'
            }`}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {formatPercent(summary.dayChangePercent)} today
            </div>
          )}
        </div>
        <div className="mt-5 flex items-center gap-6 flex-wrap">
          <div>
            <p className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-0.5">Total Assets</p>
            <p className="text-xl font-bold text-white">{formatAUD(summary.totalAUD)}</p>
          </div>
          <div className="w-px h-10 bg-white/15" />
          <div>
            <p className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-0.5">Liabilities</p>
            <p className="text-xl font-bold text-red-300">{formatAUD(summary.liabilitiesAUD)}</p>
          </div>
          <div className="w-px h-10 bg-white/15" />
          <div>
            <p className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-0.5">Currency</p>
            <p className="text-xl font-bold text-white">AUD</p>
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
    <div className="rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden transition-all duration-200 hover:-translate-y-1"
      style={{
        background: 'rgba(13,16,40,0.8)',
        border: '1px solid rgba(99,102,241,0.15)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(12px)',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.35)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.15), 4px 8px 24px ${shadowColor}` }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.15)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.3)' }}
    >
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'rgba(161,174,255,0.5)' }}>
          {label}
        </span>
        <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: gradient, boxShadow: `0 4px 16px ${shadowColor}` }}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-black tracking-tight text-white">{formatAUD(value)}</p>
        {subLabel && subValue && (
          <p className="text-xs mt-1" style={{ color: 'rgba(161,174,255,0.45)' }}>
            {subLabel}: <span className="font-semibold" style={{ color: 'rgba(165,180,252,0.9)' }}>{subValue}</span>
          </p>
        )}
      </div>
    </div>
  )
}
