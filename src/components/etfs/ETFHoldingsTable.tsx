'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { formatAUD, formatPercent, gainLossColor } from '@/lib/utils'
import { AddETFDialog } from './AddETFDialog'
import type { ETFHolding } from '@/types'
import { useRouter } from 'next/navigation'

export function ETFHoldingsTable({ holdings }: { holdings: ETFHolding[] }) {
  const router = useRouter()
  const [showAdd, setShowAdd] = useState(false)

  return (
    <div>
      <div className="p-4 flex justify-end border-b border-border">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add ETF
        </button>
      </div>

      {holdings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground text-sm mb-3">No ETF positions yet</p>
          <button onClick={() => setShowAdd(true)} className="text-sm text-primary hover:underline">
            Add your first position →
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="text-left px-6 py-3">ETF</th>
                <th className="text-right px-4 py-3">Exchange</th>
                <th className="text-right px-4 py-3">Shares</th>
                <th className="text-right px-4 py-3">Avg Price</th>
                <th className="text-right px-4 py-3">Current Price</th>
                <th className="text-right px-4 py-3">Value (AUD)</th>
                <th className="text-right px-6 py-3">Gain/Loss</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => {
                const currentValue = h.shares * (h.current_price ?? 0)
                const cost = h.cost_basis ?? 0
                const gain = currentValue - cost
                const gainPct = cost > 0 ? (gain / cost) * 100 : 0

                return (
                  <tr key={h.id} className="border-b border-border hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-base">{h.ticker}</p>
                      <p className="text-xs text-muted-foreground">{h.name}</p>
                      {h.sector && <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium mt-0.5 inline-block">{h.sector}</span>}
                    </td>
                    <td className="text-right px-4 py-4">
                      <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground font-medium">{h.exchange}</span>
                    </td>
                    <td className="text-right px-4 py-4 font-mono text-xs">{h.shares.toFixed(4)}</td>
                    <td className="text-right px-4 py-4">{h.currency === 'AUD' ? 'A$' : '$'}{h.avg_purchase_price?.toFixed(2) ?? '—'}</td>
                    <td className="text-right px-4 py-4 font-medium">{h.currency === 'AUD' ? 'A$' : '$'}{h.current_price?.toFixed(2) ?? '—'}</td>
                    <td className="text-right px-4 py-4 font-medium">{formatAUD(currentValue)}</td>
                    <td className="text-right px-6 py-4">
                      <p className={`font-medium ${gainLossColor(gain)}`}>{formatAUD(gain)}</p>
                      <p className={`text-xs ${gainLossColor(gainPct)}`}>{formatPercent(gainPct)}</p>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <AddETFDialog onClose={() => { setShowAdd(false); router.refresh() }} />}
    </div>
  )
}
