'use client'

import { useState } from 'react'
import { Plus, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react'
import { formatAUD, formatPercent, gainLossColor } from '@/lib/utils'
import { AddETFDialog } from './AddETFDialog'
import type { ETFHolding } from '@/types'
import { useRouter } from 'next/navigation'

export function ETFHoldingsTable({ holdings }: { holdings: ETFHolding[] }) {
  const router = useRouter()
  const [showAdd, setShowAdd] = useState(false)

  const totalValue = holdings.reduce((s, h) => s + h.shares * (h.current_price ?? 0), 0)
  const totalCost = holdings.reduce((s, h) => s + (h.cost_basis ?? 0), 0)
  const totalGain = totalValue - totalCost
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

  return (
    <div className="space-y-6">
      {holdings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: 'Portfolio Value', value: formatAUD(totalValue),
              gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
              shadow: 'rgba(245,158,11,0.3)',
            },
            {
              label: 'Total Invested', value: formatAUD(totalCost),
              gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              shadow: 'rgba(99,102,241,0.3)',
            },
            {
              label: 'Total Gain/Loss', value: formatAUD(totalGain),
              sub: `${totalGainPct >= 0 ? '+' : ''}${totalGainPct.toFixed(2)}%`,
              gradient: totalGain >= 0 ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
              shadow: totalGain >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
            },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-5 flex flex-col gap-3"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.label}</span>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ background: s.gradient, boxShadow: `0 4px 12px ${s.shadow}` }}>
                  <BarChart2 className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight">{s.value}</p>
                {s.sub && <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.sub}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div>
            <h3 className="font-semibold">Positions</h3>
            {holdings.length > 0 && (
              <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{holdings.length} position{holdings.length !== 1 ? 's' : ''}</p>
            )}
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 12px rgba(245,158,11,0.35)' }}>
            <Plus className="h-3 w-3" /> Add ETF
          </button>
        </div>

        {holdings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 8px 24px rgba(245,158,11,0.3)' }}>
              <BarChart2 className="h-8 w-8 text-white" />
            </div>
            <p className="font-semibold mb-1">No ETF positions yet</p>
            <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>Track your ASX and US ETF investments</p>
            <button onClick={() => setShowAdd(true)}
              className="px-4 py-2 rounded-lg text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              Add your first position →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  {['ETF', 'Exchange', 'Shares', 'Avg Price', 'Current Price', 'Value (AUD)', 'Gain/Loss'].map((h, i) => (
                    <th key={h}
                      className={`py-3 text-[10px] font-semibold uppercase tracking-widest ${i === 0 ? 'text-left px-6' : i === 6 ? 'text-right px-6' : 'text-right px-4'}`}
                      style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => {
                  const currentValue = h.shares * (h.current_price ?? 0)
                  const cost = h.cost_basis ?? 0
                  const gain = currentValue - cost
                  const gainPct = cost > 0 ? (gain / cost) * 100 : 0
                  const isPositive = gain >= 0

                  return (
                    <tr key={h.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted) / 0.4)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
                      <td className="px-6 py-4">
                        <p className="font-bold text-base">{h.ticker}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{h.name}</p>
                        {h.sector && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold mt-1 inline-block"
                            style={{ background: 'rgba(245,158,11,0.12)', color: '#d97706' }}>
                            {h.sector}
                          </span>
                        )}
                      </td>
                      <td className="text-right px-4 py-4">
                        <span className="text-[10px] px-2 py-1 rounded-full font-semibold"
                          style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}>
                          {h.exchange}
                        </span>
                      </td>
                      <td className="text-right px-4 py-4 font-mono text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{h.shares.toFixed(4)}</td>
                      <td className="text-right px-4 py-4 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {h.currency === 'AUD' ? 'A$' : '$'}{h.avg_purchase_price?.toFixed(2) ?? '—'}
                      </td>
                      <td className="text-right px-4 py-4 font-semibold">
                        {h.currency === 'AUD' ? 'A$' : '$'}{h.current_price?.toFixed(2) ?? '—'}
                      </td>
                      <td className="text-right px-4 py-4 font-semibold">{formatAUD(currentValue)}</td>
                      <td className="text-right px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {isPositive ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                          <div className="text-right">
                            <p className={`font-semibold text-sm ${gainLossColor(gain)}`}>{formatAUD(gain)}</p>
                            <p className={`text-[11px] ${gainLossColor(gainPct)}`}>{formatPercent(gainPct)}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && <AddETFDialog onClose={() => { setShowAdd(false); router.refresh() }} />}
    </div>
  )
}
