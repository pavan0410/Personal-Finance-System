import { Header } from '@/components/layout/Header'
import { InsightsClient } from '@/components/insights/InsightsClient'
import { createClient } from '@/lib/supabase/server'
import { getExchangeRate } from '@/lib/currency'

export default async function InsightsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: accounts = [] },
    { data: mfHoldings = [] },
    { data: etfHoldings = [] },
    { data: superAccounts = [] },
    { data: properties = [] },
    { data: goals = [] },
  ] = await Promise.all([
    supabase.from('accounts').select('name, type, currency, balance').eq('user_id', user!.id),
    supabase.from('mutual_fund_holdings').select('scheme_name, fund_house, category, units, avg_purchase_nav, current_nav, cost_basis_inr, sip_active, sip_amount').eq('user_id', user!.id),
    supabase.from('etf_holdings').select('ticker, name, exchange, shares, avg_purchase_price, current_price, currency, cost_basis, sector').eq('user_id', user!.id),
    supabase.from('superannuation').select('fund_name, balance, employer_contributions_ytd, personal_contributions_ytd').eq('user_id', user!.id),
    supabase.from('real_estate').select('name, country, currency, current_valuation, loan_outstanding, rental_income_monthly').eq('user_id', user!.id),
    supabase.from('goals').select('name, category, target_amount, current_amount, target_date, priority').eq('user_id', user!.id),
  ])

  const inrAudRate = await getExchangeRate('INR', 'AUD')

  const portfolioSnapshot = {
    baseCurrency: 'AUD',
    inrAudRate,
    accounts: accounts ?? [],
    mutualFunds: (mfHoldings ?? []).map(h => ({
      ...h,
      currentValueINR: h.units * (h.current_nav ?? 0),
      currentValueAUD: h.units * (h.current_nav ?? 0) * inrAudRate,
      gainLossINR: h.units * (h.current_nav ?? 0) - (h.cost_basis_inr ?? 0),
    })),
    etfs: (etfHoldings ?? []).map(h => ({
      ...h,
      currentValue: h.shares * (h.current_price ?? 0),
      gainLoss: h.shares * (h.current_price ?? 0) - (h.cost_basis ?? 0),
    })),
    superannuation: superAccounts ?? [],
    realEstate: properties ?? [],
    goals: goals ?? [],
  }

  return (
    <>
      <Header title="AI Insights" />
      <main className="flex-1 p-6">
        <InsightsClient portfolioSnapshot={portfolioSnapshot} />
      </main>
    </>
  )
}
