import { Header } from '@/components/layout/Header'
import { MFHoldingsTable } from '@/components/mutual-funds/MFHoldingsTable'
import { createClient } from '@/lib/supabase/server'
import { getExchangeRate } from '@/lib/currency'
import { formatAUD, formatINR, formatPercent, gainLossColor } from '@/lib/utils'
import { TrendingUp, IndianRupee } from 'lucide-react'
import Decimal from 'decimal.js'

export default async function MutualFundsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: holdings = [] } = await supabase
    .from('mutual_fund_holdings')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const inrAudRate = await getExchangeRate('INR', 'AUD')

  const totalValueINR = (holdings ?? []).reduce((sum, h) => {
    return new Decimal(sum).plus(h.units * (h.current_nav ?? 0)).toNumber()
  }, 0)
  const totalCostINR = (holdings ?? []).reduce((sum, h) => {
    return new Decimal(sum).plus(h.cost_basis_inr ?? 0).toNumber()
  }, 0)
  const totalGainINR = totalValueINR - totalCostINR
  const totalGainPct = totalCostINR > 0 ? (totalGainINR / totalCostINR) * 100 : 0
  const totalValueAUD = totalValueINR * inrAudRate

  return (
    <>
      <Header title="Mutual Funds" />
      <main className="flex-1 p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <IndianRupee className="h-4 w-4" /> Total Value (INR)
            </div>
            <p className="text-2xl font-bold">{formatINR(totalValueINR)}</p>
            <p className="text-xs text-muted-foreground mt-1">≈ {formatAUD(totalValueAUD)} AUD</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" /> Total Gain/Loss
            </div>
            <p className={`text-2xl font-bold ${gainLossColor(totalGainINR)}`}>
              {formatINR(totalGainINR)}
            </p>
            <p className={`text-xs mt-1 ${gainLossColor(totalGainPct)}`}>
              {formatPercent(totalGainPct)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" /> Total Invested
            </div>
            <p className="text-2xl font-bold">{formatINR(totalCostINR)}</p>
            <p className="text-xs text-muted-foreground mt-1">{(holdings ?? []).length} scheme{(holdings ?? []).length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Holdings table */}
        <div className="rounded-xl border border-border bg-card">
          <div className="p-6 border-b border-border">
            <h3 className="font-semibold">Holdings</h3>
          </div>
          <MFHoldingsTable holdings={holdings ?? []} inrAudRate={inrAudRate} />
        </div>
      </main>
    </>
  )
}
