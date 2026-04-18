import { Header } from '@/components/layout/Header'
import { NetWorthCard, StatCard } from '@/components/dashboard/NetWorthCard'
import { AssetAllocationChart } from '@/components/dashboard/AssetAllocationChart'
import { createClient } from '@/lib/supabase/server'
import { buildPortfolioSummary } from '@/lib/calculations'
import { getExchangeRate } from '@/lib/currency'
import { formatINR } from '@/lib/utils'
import { CreditCard, TrendingUp, Landmark, Home, Target, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
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
    supabase.from('accounts').select('*').eq('user_id', user!.id),
    supabase.from('mutual_fund_holdings').select('*').eq('user_id', user!.id),
    supabase.from('etf_holdings').select('*').eq('user_id', user!.id),
    supabase.from('superannuation').select('*').eq('user_id', user!.id),
    supabase.from('real_estate').select('*').eq('user_id', user!.id),
    supabase.from('goals').select('*').eq('user_id', user!.id),
  ])

  const inrAudRate = await getExchangeRate('INR', 'AUD')
  const summary = buildPortfolioSummary(
    accounts ?? [],
    mfHoldings ?? [],
    etfHoldings ?? [],
    superAccounts ?? [],
    properties ?? [],
    inrAudRate
  )

  const totalMFValueINR = (mfHoldings ?? []).reduce((sum, h) => {
    return sum + (h.units * (h.current_nav ?? h.avg_purchase_nav ?? 0))
  }, 0)

  return (
    <>
      <Header title="Overview" />
      <main className="flex-1 p-6 space-y-6">
        {/* Net worth hero */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <NetWorthCard summary={summary} />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <StatCard
            label="Savings & Accounts"
            value={summary.accountsAUD}
            icon={<CreditCard className="h-4 w-4 text-white" />}
            gradient="linear-gradient(135deg, #6366f1, #8b5cf6)"
            shadowColor="rgba(99,102,241,0.35)"
          />
          <StatCard
            label="Mutual Funds 🇮🇳"
            value={summary.mutualFundsAUD}
            subLabel="INR"
            subValue={formatINR(totalMFValueINR)}
            icon={<TrendingUp className="h-4 w-4 text-white" />}
            gradient="linear-gradient(135deg, #10b981, #059669)"
            shadowColor="rgba(16,185,129,0.35)"
          />
          <StatCard
            label="ETFs 🇦🇺 🇺🇸"
            value={summary.etfsAUD}
            icon={<TrendingUp className="h-4 w-4 text-white" />}
            gradient="linear-gradient(135deg, #f59e0b, #d97706)"
            shadowColor="rgba(245,158,11,0.35)"
          />
          <StatCard
            label="Superannuation"
            value={summary.superAUD}
            icon={<Landmark className="h-4 w-4 text-white" />}
            gradient="linear-gradient(135deg, #3b82f6, #2563eb)"
            shadowColor="rgba(59,130,246,0.35)"
          />
          <StatCard
            label="Real Estate"
            value={summary.realEstateAUD}
            icon={<Home className="h-4 w-4 text-white" />}
            gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)"
            shadowColor="rgba(139,92,246,0.35)"
          />
          <StatCard
            label="Liabilities"
            value={summary.liabilitiesAUD}
            icon={<CreditCard className="h-4 w-4 text-white" />}
            gradient="linear-gradient(135deg, #ef4444, #dc2626)"
            shadowColor="rgba(239,68,68,0.35)"
          />
        </div>

        {/* Charts + Goals row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Asset allocation */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-4">Asset Allocation</h3>
            <AssetAllocationChart summary={summary} />
          </div>

          {/* Goals preview */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Goals</h3>
              <Link href="/goals" className="text-xs text-primary flex items-center gap-1 hover:underline">
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            {(!goals || goals.length === 0) ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Target className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No goals set yet</p>
                <Link href="/goals" className="mt-3 text-sm text-primary hover:underline">
                  Create your first goal →
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {goals.slice(0, 4).map((goal) => {
                  const pct = Math.min(100, (goal.current_amount / goal.target_amount) * 100)
                  return (
                    <li key={goal.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{goal.name}</span>
                        <span className="text-muted-foreground">{pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
