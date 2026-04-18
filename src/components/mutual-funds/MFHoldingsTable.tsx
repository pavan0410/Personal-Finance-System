'use client'

import { useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { formatINR, formatAUD, formatPercent, gainLossColor } from '@/lib/utils'
import { AddMFDialog } from './AddMFDialog'
import type { MutualFundHolding } from '@/types'
import { useRouter } from 'next/navigation'

interface Props {
  holdings: MutualFundHolding[]
  inrAudRate: number
}

export function MFHoldingsTable({ holdings, inrAudRate }: Props) {
  const router = useRouter()
  const [showAdd, setShowAdd] = useState(false)

  return (
    <div>
      {/* Actions */}
      <div className="p-4 flex justify-end gap-2 border-b border-border">
        <button
          onClick={() => router.refresh()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh NAV
        </button>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add Holding
        </button>
      </div>

      {/* Table */}
      {holdings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground text-sm mb-3">No mutual fund holdings yet</p>
          <button
            onClick={() => setShowAdd(true)}
            className="text-sm text-primary hover:underline"
          >
            Add your first holding →
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="text-left px-6 py-3">Scheme</th>
                <th className="text-right px-4 py-3">Units</th>
                <th className="text-right px-4 py-3">Avg NAV</th>
                <th className="text-right px-4 py-3">Current NAV</th>
                <th className="text-right px-4 py-3">Value (INR)</th>
                <th className="text-right px-4 py-3">Value (AUD)</th>
                <th className="text-right px-6 py-3">Gain/Loss</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => {
                const currentValueINR = h.units * (h.current_nav ?? 0)
                const costINR = h.cost_basis_inr ?? 0
                const gainINR = currentValueINR - costINR
                const gainPct = costINR > 0 ? (gainINR / costINR) * 100 : 0
                const valueAUD = currentValueINR * inrAudRate

                return (
                  <tr key={h.id} className="border-b border-border hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium leading-tight">{h.scheme_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {h.fund_house && <span className="text-xs text-muted-foreground">{h.fund_house}</span>}
                        {h.category && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                            {h.category}
                          </span>
                        )}
                        {h.sip_active && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
                            SIP
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-right px-4 py-4 font-mono text-xs">{h.units.toFixed(4)}</td>
                    <td className="text-right px-4 py-4">₹{h.avg_purchase_nav?.toFixed(2) ?? '—'}</td>
                    <td className="text-right px-4 py-4 font-medium">₹{h.current_nav?.toFixed(2) ?? '—'}</td>
                    <td className="text-right px-4 py-4 font-medium">{formatINR(currentValueINR)}</td>
                    <td className="text-right px-4 py-4 text-muted-foreground">{formatAUD(valueAUD)}</td>
                    <td className="text-right px-6 py-4">
                      <p className={`font-medium ${gainLossColor(gainINR)}`}>{formatINR(gainINR)}</p>
                      <p className={`text-xs ${gainLossColor(gainPct)}`}>{formatPercent(gainPct)}</p>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <AddMFDialog onClose={() => { setShowAdd(false); router.refresh() }} />}
    </div>
  )
}
