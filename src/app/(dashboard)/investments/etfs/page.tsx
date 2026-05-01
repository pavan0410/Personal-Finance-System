import { Header } from '@/components/layout/Header'
import { ETFHoldingsTable } from '@/components/etfs/ETFHoldingsTable'
import { createClient } from '@/lib/supabase/server'
import { formatAUD, formatPercent, gainLossColor } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'
import Decimal from 'decimal.js'

const CARD_STYLE = {
  background: 'rgba(13,16,40,0.8)',
  border: '1px solid rgba(99,102,241,0.15)',
  backdropFilter: 'blur(12px)',
}

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
          <div className="rounded-2xl p-5" style={CARD_STYLE}>
            <p className="text-sm mb-2" style={{ color: 'rgba(161,174,255,0.5)' }}>Total Value</p>
            <p className="text-2xl font-bold" style={{ color: 'rgba(220,225,255,0.9)' }}>{formatAUD(totalValue)}</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(161,174,255,0.5)' }}>{(holdings ?? []).length} position{(holdings ?? []).length !== 1 ? 's' : ''}</p>
          </div>
          <div className="rounded-2xl p-5" style={CARD_STYLE}>
            <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'rgba(161,174,255,0.5)' }}>
              <TrendingUp className="h-4 w-4" /> Total Gain/Loss
            </div>
            <p className={`text-2xl font-bold ${gainLossColor(totalGain)}`}>{formatAUD(totalGain)}</p>
            <p className={`text-xs mt-1 ${gainLossColor(totalGainPct)}`}>{formatPercent(totalGainPct)}</p>
          </div>
          <div className="rounded-2xl p-5" style={CARD_STYLE}>
            <p className="text-sm mb-2" style={{ color: 'rgba(161,174,255,0.5)' }}>Total Invested</p>
            <p className="text-2xl font-bold" style={{ color: 'rgba(220,225,255,0.9)' }}>{formatAUD(totalCost)}</p>
          </div>
        </div>

        <ETFHoldingsTable holdings={holdings ?? []} />
      </main>
    </>
  )
}
