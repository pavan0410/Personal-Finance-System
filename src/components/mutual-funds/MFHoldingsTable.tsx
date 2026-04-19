'use client'

import { useState } from 'react'
import { Plus, RefreshCw, TrendingUp, TrendingDown, IndianRupee, Trash2, Loader2 } from 'lucide-react'
import { formatINR, formatAUD, formatPercent, gainLossColor } from '@/lib/utils'
import { AddMFDialog } from './AddMFDialog'
import { createClient } from '@/lib/supabase/client'
import type { MutualFundHolding } from '@/types'
import { useRouter } from 'next/navigation'

interface Props {
  holdings: MutualFundHolding[]
  inrAudRate: number
}

export function MFHoldingsTable({ holdings, inrAudRate }: Props) {
  const router = useRouter()
  const [showAdd, setShowAdd] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefreshNAV() {
    setRefreshing(true)
    try {
      await fetch('/api/mf/refresh-nav', { method: 'POST' })
      router.refresh()
    } finally {
      setRefreshing(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this holding?')) return
    setDeletingId(id)
    const supabase = createClient()
    await supabase.from('mutual_fund_holdings').delete().eq('id', id)
    setDeletingId(null)
    router.refresh()
  }

  const totalValueINR = holdings.reduce((s, h) => s + (h.current_nav != null ? h.units * h.current_nav : (h.cost_basis_inr ?? 0)), 0)
  const totalCostINR = holdings.reduce((s, h) => s + (h.cost_basis_inr ?? 0), 0)
  const totalGainINR = totalValueINR - totalCostINR
  const totalGainPct = totalCostINR > 0 ? (totalGainINR / totalCostINR) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Summary stat cards */}
      {holdings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: 'Portfolio Value', value: formatINR(totalValueINR),
              sub: formatAUD(totalValueINR * inrAudRate),
              gradient: 'linear-gradient(135deg, #10b981, #059669)',
              shadow: 'rgba(16,185,129,0.3)',
            },
            {
              label: 'Total Invested', value: formatINR(totalCostINR),
              sub: formatAUD(totalCostINR * inrAudRate),
              gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              shadow: 'rgba(99,102,241,0.3)',
            },
            {
              label: 'Total Gain/Loss', value: formatINR(totalGainINR),
              sub: `${totalGainPct >= 0 ? '+' : ''}${totalGainPct.toFixed(2)}%`,
              gradient: totalGainINR >= 0
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #ef4444, #dc2626)',
              shadow: totalGainINR >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
            },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-5 flex flex-col gap-3"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.label}</span>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ background: s.gradient, boxShadow: `0 4px 12px ${s.shadow}` }}>
                  <IndianRupee className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight">{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table card */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}>
        {/* Header bar */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div>
            <h3 className="font-semibold">Holdings</h3>
            {holdings.length > 0 && (
              <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{holdings.length} fund{holdings.length !== 1 ? 's' : ''}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRefreshNAV} disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50"
              style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
              {refreshing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Refresh NAV
            </button>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, hsl(246 83% 60%), hsl(280 83% 60%))', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}>
              <Plus className="h-3 w-3" /> Add Holding
            </button>
          </div>
        </div>

        {holdings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}>
              <IndianRupee className="h-8 w-8 text-white" />
            </div>
            <p className="font-semibold mb-1">No mutual funds yet</p>
            <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>Start tracking your Indian mutual fund investments</p>
            <button onClick={() => setShowAdd(true)}
              className="px-4 py-2 rounded-lg text-sm text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, hsl(246 83% 60%), hsl(280 83% 60%))' }}>
              Add your first holding →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  {['Scheme', 'Units', 'Avg NAV', 'Current NAV', 'Value (INR)', 'Value (AUD)', 'Gain/Loss', ''].map((h, i) => (
                    <th key={`${h}-${i}`}
                      className={`py-3 text-[10px] font-semibold uppercase tracking-widest ${i === 0 ? 'text-left px-6' : i === 7 ? 'px-4' : 'text-right px-4'}`}
                      style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => {
                  const hasNav = h.current_nav != null
                  const currentValueINR = hasNav ? h.units * h.current_nav! : (h.cost_basis_inr ?? 0)
                  const costINR = h.cost_basis_inr ?? 0
                  const gainINR = hasNav ? currentValueINR - costINR : 0
                  const gainPct = hasNav && costINR > 0 ? (gainINR / costINR) * 100 : 0
                  const valueAUD = currentValueINR * inrAudRate
                  const isPositive = gainINR >= 0

                  return (
                    <tr key={h.id} className="group transition-colors relative"
                      style={{ borderBottom: '1px solid hsl(var(--border))' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted) / 0.4)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
                      <td className="px-6 py-4">
                        <p className="font-medium leading-tight max-w-[220px] truncate">{h.scheme_name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {h.fund_house && <span className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{h.fund_house}</span>}
                          {h.category && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                              style={{ background: 'hsl(246 83% 60% / 0.12)', color: 'hsl(246 83% 65%)' }}>
                              {h.category}
                            </span>
                          )}
                          {h.sip_active && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                              style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                              SIP
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-right px-4 py-4 font-mono text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{h.units.toFixed(4)}</td>
                      <td className="text-right px-4 py-4 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>₹{h.avg_purchase_nav?.toFixed(2) ?? '—'}</td>
                      <td className="text-right px-4 py-4 font-semibold text-sm">₹{h.current_nav?.toFixed(2) ?? '—'}</td>
                      <td className="text-right px-4 py-4 font-semibold">{formatINR(currentValueINR)}</td>
                      <td className="text-right px-4 py-4 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{formatAUD(valueAUD)}</td>
                      <td className="text-right px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {isPositive ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                          <div className="text-right">
                            <p className={`font-semibold text-sm ${gainLossColor(gainINR)}`}>{formatINR(gainINR)}</p>
                            <p className={`text-[11px] ${gainLossColor(gainPct)}`}>{formatPercent(gainPct)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button onClick={() => handleDelete(h.id)} disabled={deletingId === h.id}
                          className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                          style={{ color: 'hsl(var(--muted-foreground))' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground))' }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && <AddMFDialog onClose={() => { setShowAdd(false); router.refresh() }} />}
    </div>
  )
}
