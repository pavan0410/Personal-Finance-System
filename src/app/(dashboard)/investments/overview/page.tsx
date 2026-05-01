import { Header } from '@/components/layout/Header'
import { createClient } from '@/lib/supabase/server'
import { getExchangeRate } from '@/lib/currency'
import { formatAUD, formatINR, formatPercent, gainLossColor } from '@/lib/utils'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

const CARD_STYLE = {
  background: 'rgba(13,16,40,0.8)',
  border: '1px solid rgba(99,102,241,0.15)',
  backdropFilter: 'blur(12px)',
}

export default async function InvestmentOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: mfHoldings = [] }, { data: etfHoldings = [] }] = await Promise.all([
    supabase.from('mutual_fund_holdings').select('*').eq('user_id', user!.id),
    supabase.from('etf_holdings').select('*').eq('user_id', user!.id),
  ])

  const inrAudRate = await getExchangeRate('INR', 'AUD')

  const mfValueINR = (mfHoldings ?? []).reduce((s, h) => s + h.units * (h.current_nav ?? 0), 0)
  const mfCostINR = (mfHoldings ?? []).reduce((s, h) => s + (h.cost_basis_inr ?? 0), 0)
  const mfValueAUD = mfValueINR * inrAudRate

  const etfValue = (etfHoldings ?? []).reduce((s, h) => s + h.shares * (h.current_price ?? 0), 0)
  const etfCost = (etfHoldings ?? []).reduce((s, h) => s + (h.cost_basis ?? 0), 0)

  const totalInvestedAUD = mfValueAUD + etfValue
  const totalCostAUD = mfCostINR * inrAudRate + etfCost
  const totalGainAUD = totalInvestedAUD - totalCostAUD
  const totalGainPct = totalCostAUD > 0 ? (totalGainAUD / totalCostAUD) * 100 : 0

  return (
    <>
      <Header title="Investment Overview" />
      <main className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl p-5" style={CARD_STYLE}>
            <p className="text-sm mb-2" style={{ color: 'rgba(161,174,255,0.5)' }}>Total Portfolio (AUD)</p>
            <p className="text-3xl font-bold" style={{ color: 'rgba(220,225,255,0.9)' }}>{formatAUD(totalInvestedAUD)}</p>
          </div>
          <div className="rounded-2xl p-5" style={CARD_STYLE}>
            <p className="text-sm mb-2" style={{ color: 'rgba(161,174,255,0.5)' }}>Total Gain/Loss</p>
            <p className={`text-2xl font-bold ${gainLossColor(totalGainAUD)}`}>{formatAUD(totalGainAUD)}</p>
            <p className={`text-xs mt-1 ${gainLossColor(totalGainPct)}`}>{formatPercent(totalGainPct)}</p>
          </div>
          <div className="rounded-2xl p-5" style={CARD_STYLE}>
            <p className="text-sm mb-2" style={{ color: 'rgba(161,174,255,0.5)' }}>Total Invested</p>
            <p className="text-2xl font-bold" style={{ color: 'rgba(220,225,255,0.9)' }}>{formatAUD(totalCostAUD)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* MF Summary */}
          <div className="rounded-2xl p-6" style={CARD_STYLE}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: 'rgba(220,225,255,0.9)' }}>🇮🇳 Mutual Funds (India)</h3>
              <Link href="/investments/mutual-funds"
                className="text-xs flex items-center gap-1 transition-colors"
                style={{ color: '#818cf8' }}
                onMouseEnter={undefined}
              >
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: 'rgba(220,225,255,0.9)' }}>{formatINR(mfValueINR)}</p>
            <p className="text-sm" style={{ color: 'rgba(161,174,255,0.5)' }}>≈ {formatAUD(mfValueAUD)} AUD</p>
            <p className={`text-sm mt-2 ${gainLossColor(mfValueINR - mfCostINR)}`}>
              {formatINR(mfValueINR - mfCostINR)} ({formatPercent(mfCostINR > 0 ? ((mfValueINR - mfCostINR) / mfCostINR) * 100 : 0)})
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(161,174,255,0.5)' }}>{(mfHoldings ?? []).length} schemes</p>
          </div>

          {/* ETF Summary */}
          <div className="rounded-2xl p-6" style={CARD_STYLE}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: 'rgba(220,225,255,0.9)' }}>🇦🇺 🇺🇸 ETFs</h3>
              <Link href="/investments/etfs"
                className="text-xs flex items-center gap-1 transition-colors"
                style={{ color: '#818cf8' }}>
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: 'rgba(220,225,255,0.9)' }}>{formatAUD(etfValue)}</p>
            <p className={`text-sm mt-2 ${gainLossColor(etfValue - etfCost)}`}>
              {formatAUD(etfValue - etfCost)} ({formatPercent(etfCost > 0 ? ((etfValue - etfCost) / etfCost) * 100 : 0)})
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(161,174,255,0.5)' }}>{(etfHoldings ?? []).length} positions</p>
          </div>
        </div>
      </main>
    </>
  )
}
