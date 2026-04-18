'use client'

import { useState } from 'react'
import { Plus, Landmark, Shield, Loader2, X, TrendingUp } from 'lucide-react'
import { formatAUD } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Superannuation } from '@/types'

const inputCls = 'w-full h-10 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors'

export function SuperClient({ accounts, userId }: { accounts: Superannuation[]; userId: string }) {
  const router = useRouter()
  const [showAdd, setShowAdd] = useState(false)
  const [fundName, setFundName] = useState('')
  const [balance, setBalance] = useState('')
  const [memberNum, setMemberNum] = useState('')
  const [investOption, setInvestOption] = useState('')
  const [empContrib, setEmpContrib] = useState('')
  const [personalContrib, setPersonalContrib] = useState('')
  const [balanceDate, setBalanceDate] = useState(new Date().toISOString().split('T')[0])
  const [deathCover, setDeathCover] = useState('')
  const [tpdCover, setTpdCover] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const totalBalance = accounts.reduce((s, a) => s + (a.balance ?? 0), 0)
  const totalEmployer = accounts.reduce((s, a) => s + a.employer_contributions_ytd, 0)
  const totalPersonal = accounts.reduce((s, a) => s + a.personal_contributions_ytd, 0)
  const totalContribs = totalEmployer + totalPersonal

  async function handleSave() {
    if (!fundName || !balance) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('superannuation').insert({
      user_id: userId, fund_name: fundName, balance: parseFloat(balance),
      member_number: memberNum || null, investment_option: investOption || null,
      employer_contributions_ytd: parseFloat(empContrib) || 0,
      personal_contributions_ytd: parseFloat(personalContrib) || 0,
      balance_date: balanceDate,
      insurance_death_cover: deathCover ? parseFloat(deathCover) : null,
      insurance_tpd_cover: tpdCover ? parseFloat(tpdCover) : null,
    })
    if (error) { setError(error.message); setSaving(false) }
    else { setShowAdd(false); router.refresh() }
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Balance', value: formatAUD(totalBalance), gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', shadow: 'rgba(59,130,246,0.3)', icon: <Landmark className="h-4 w-4 text-white" /> },
          { label: 'Employer YTD', value: formatAUD(totalEmployer), gradient: 'linear-gradient(135deg, #10b981, #059669)', shadow: 'rgba(16,185,129,0.3)', icon: <TrendingUp className="h-4 w-4 text-white" /> },
          { label: 'Personal YTD', value: formatAUD(totalPersonal), gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', shadow: 'rgba(99,102,241,0.3)', icon: <TrendingUp className="h-4 w-4 text-white" /> },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5 flex flex-col gap-3"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.label}</span>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ background: s.gradient, boxShadow: `0 4px 12px ${s.shadow}` }}>
                {s.icon}
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Contributions breakdown */}
      {accounts.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <p className="text-sm font-semibold mb-3">Contributions YTD Breakdown</p>
          <div className="flex gap-3 mb-2">
            <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Employer <span className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{formatAUD(totalEmployer)}</span>
            </div>
            <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Personal <span className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{formatAUD(totalPersonal)}</span>
            </div>
          </div>
          <div className="h-3 rounded-full overflow-hidden flex" style={{ background: 'hsl(var(--muted))' }}>
            {totalContribs > 0 && (
              <>
                <div className="h-full transition-all" style={{ width: `${(totalEmployer / totalContribs) * 100}%`, background: 'linear-gradient(90deg, #10b981, #059669)' }} />
                <div className="h-full transition-all" style={{ width: `${(totalPersonal / totalContribs) * 100}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
              </>
            )}
          </div>
        </div>
      )}

      {/* Funds list */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div>
            <h3 className="font-semibold">Super Funds</h3>
            {accounts.length > 0 && <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{accounts.length} fund{accounts.length !== 1 ? 's' : ''}</p>}
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.35)' }}>
            <Plus className="h-3 w-3" /> Add Fund
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 8px 24px rgba(59,130,246,0.3)' }}>
              <Landmark className="h-8 w-8 text-white" />
            </div>
            <p className="font-semibold mb-1">No super funds added</p>
            <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>Track your superannuation balance and contributions</p>
            <button onClick={() => setShowAdd(true)}
              className="px-4 py-2 rounded-lg text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
              Add your super fund →
            </button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
            {accounts.map((a) => (
              <div key={a.id} className="p-6 transition-colors"
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted) / 0.3)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                    <Landmark className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-lg">{a.fund_name}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {a.member_number && <span>Member: {a.member_number}</span>}
                      {a.investment_option && <span>Option: {a.investment_option}</span>}
                      {a.balance_date && <span>As at {a.balance_date}</span>}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-xl p-3" style={{ background: 'hsl(var(--muted) / 0.5)' }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Balance</p>
                    <p className="font-bold">{formatAUD(a.balance)}</p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: 'rgba(16,185,129,0.08)' }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#10b981' }}>Employer YTD</p>
                    <p className="font-bold text-emerald-500">{formatAUD(a.employer_contributions_ytd)}</p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: 'rgba(99,102,241,0.08)' }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'hsl(246 83% 65%)' }}>Personal YTD</p>
                    <p className="font-bold" style={{ color: 'hsl(246 83% 60%)' }}>{formatAUD(a.personal_contributions_ytd)}</p>
                  </div>
                  {(a.insurance_death_cover || a.insurance_tpd_cover) && (
                    <div className="rounded-xl p-3" style={{ background: 'rgba(139,92,246,0.08)' }}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1 flex items-center gap-1" style={{ color: '#8b5cf6' }}>
                        <Shield className="h-2.5 w-2.5" /> Insurance
                      </p>
                      {a.insurance_death_cover && <p className="text-xs">Death: {formatAUD(a.insurance_death_cover)}</p>}
                      {a.insurance_tpd_cover && <p className="text-xs">TPD: {formatAUD(a.insurance_tpd_cover)}</p>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <div className="px-6 py-5 flex items-center justify-between sticky top-0 z-10"
              style={{ borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}>
              <div>
                <h2 className="font-bold text-lg">Add Super Fund</h2>
                <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Track your superannuation details</p>
              </div>
              <button onClick={() => setShowAdd(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ color: 'hsl(var(--muted-foreground))' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Fund Name *</label>
                <input value={fundName} onChange={(e) => setFundName(e.target.value)} placeholder="Australian Super, REST, Hostplus..."
                  className={inputCls} style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Balance (AUD) *</label>
                  <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="150000"
                    className={inputCls} style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Balance Date</label>
                  <input type="date" value={balanceDate} onChange={(e) => setBalanceDate(e.target.value)}
                    className={inputCls} style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Member Number</label>
                  <input value={memberNum} onChange={(e) => setMemberNum(e.target.value)}
                    className={inputCls} style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Investment Option</label>
                  <input value={investOption} onChange={(e) => setInvestOption(e.target.value)} placeholder="Balanced, Growth..."
                    className={inputCls} style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Employer Contrib YTD</label>
                  <input type="number" value={empContrib} onChange={(e) => setEmpContrib(e.target.value)} placeholder="0"
                    className={inputCls} style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Personal Contrib YTD</label>
                  <input type="number" value={personalContrib} onChange={(e) => setPersonalContrib(e.target.value)} placeholder="0"
                    className={inputCls} style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Insurance Coverage</label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" value={deathCover} onChange={(e) => setDeathCover(e.target.value)} placeholder="Death cover"
                    className={inputCls} style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
                  <input type="number" value={tpdCover} onChange={(e) => setTpdCover(e.target.value)} placeholder="TPD cover"
                    className={inputCls} style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
                </div>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}
            </div>
            <div className="px-6 py-4 flex justify-end gap-3 sticky bottom-0"
              style={{ borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}>
              <button onClick={() => setShowAdd(false)}
                className="px-4 py-2 text-sm rounded-lg transition-colors"
                style={{ border: '1px solid hsl(var(--border))' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !fundName || !balance}
                className="px-5 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50 flex items-center gap-2 transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Fund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
