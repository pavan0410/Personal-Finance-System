import { Header } from '@/components/layout/Header'
import { ETFHoldingsTable } from '@/components/etfs/ETFHoldingsTable'
import { createClient } from '@/lib/supabase/server'
import { formatAUD, formatPercent, gainLossColor } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'
import Decimal from 'decimal.js'

export default async function ETFPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: holdings = [] } = await supabase
    .from('etf_holdings')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const totalValue = (holdings ?? []).reduce((sum, h) => {
    return new Decimal(sum).plus(h.shares * (h.current_price ?? 0)).toNumber()
  }, 0)
  const totalCost = (holdings ?? []).reduce((sum, h) => {
    return new Decimal(sum).plus(h.cost_basis ?? 0).toNumber()
  }, 0)
  const totalGain = totalValue - totalCost
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

  return (
    <>
      <Header title="ETF Holdings" />
      <main className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground mb-2">Total Value</p>
            <p className="text-2xl font-bold">{formatAUD(totalValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">{(holdings ?? []).length} position{(holdings ?? []).length !== 1 ? 's' : ''}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" /> Total Gain/Loss
            </div>
            <p className={`text-2xl font-bold ${gainLossColor(totalGain)}`}>{formatAUD(totalGain)}</p>
            <p className={`text-xs mt-1 ${gainLossColor(totalGainPct)}`}>{formatPercent(totalGainPct)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground mb-2">Total Invested</p>
            <p className="text-2xl font-bold">{formatAUD(totalCost)}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="p-6 border-b border-border">
            <h3 className="font-semibold">Positions</h3>
          </div>
          <ETFHoldingsTable holdings={holdings ?? []} />
        </div>
      </main>
    </>
  )
}
