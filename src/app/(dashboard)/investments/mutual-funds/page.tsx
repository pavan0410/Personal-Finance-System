import { Header } from '@/components/layout/Header'
import { MFHoldingsTable } from '@/components/mutual-funds/MFHoldingsTable'
import { SIPHistory } from '@/components/mutual-funds/SIPHistory'
import { createClient } from '@/lib/supabase/server'
import { getExchangeRate } from '@/lib/currency'
import { formatAUD, formatINR, formatPercent, gainLossColor } from '@/lib/utils'
import { TrendingUp, IndianRupee } from 'lucide-react'
import Decimal from 'decimal.js'

const CARD_STYLE = {
  background: 'rgba(13,16,40,0.8)',
  border: '1px solid rgba(99,102,241,0.15)',
  backdropFilter: 'blur(12px)',
}

export default async function MutualFundsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: holdings = [] } = await supabase
    .from('mutual_fund_holdings')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const { data: sipHistory = [] } = await supabase
    .from('sip_history')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(30)

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
          <div className="rounded-2xl p-5" style={CARD_STYLE}>
            <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'rgba(161,174,255,0.5)' }}>
              <IndianRupee className="h-4 w-4" /> Total Value (INR)
            </div>
            <p className="text-2xl font-bold" style={{ color: 'rgba(220,225,255,0.9)' }}>{formatINR(totalValueINR)}</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(161,174,255,0.5)' }}>≈ {formatAUD(totalValueAUD)} AUD</p>
          </div>
          <div className="rounded-2xl p-5" style={CARD_STYLE}>
            <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'rgba(161,174,255,0.5)' }}>
              <TrendingUp className="h-4 w-4" /> Total Gain/Loss
            </div>
            <p className={`text-2xl font-bold ${gainLossColor(totalGainINR)}`}>
              {formatINR(totalGainINR)}
            </p>
            <p className={`text-xs mt-1 ${gainLossColor(totalGainPct)}`}>
              {formatPercent(totalGainPct)}
            </p>
          </div>
          <div className="rounded-2xl p-5" style={CARD_STYLE}>
            <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'rgba(161,174,255,0.5)' }}>
              <TrendingUp className="h-4 w-4" /> Total Invested
            </div>
            <p className="text-2xl font-bold" style={{ color: 'rgba(220,225,255,0.9)' }}>{formatINR(totalCostINR)}</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(161,174,255,0.5)' }}>{(holdings ?? []).length} scheme{(holdings ?? []).length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Holdings table */}
        <MFHoldingsTable holdings={holdings ?? []} inrAudRate={inrAudRate} />

        {/* SIP Sync History */}
        <div className="rounded-2xl overflow-hidden" style={CARD_STYLE}>
          <div className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
            <div>
              <h3 className="font-semibold" style={{ color: 'rgba(220,225,255,0.9)' }}>Email Sync History</h3>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(161,174,255,0.5)' }}>Auto-updates from INDmoney SIP emails</p>
            </div>
            {(sipHistory?.length ?? 0) > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                {sipHistory?.length} event{sipHistory?.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <SIPHistory events={sipHistory ?? []} />
        </div>
      </main>
    </>
  )
}
