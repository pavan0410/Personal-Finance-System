'use client'

import { useState } from 'react'
import { Plus, Landmark, Shield, Loader2, X } from 'lucide-react'
import { formatAUD } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Superannuation } from '@/types'

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

  async function handleSave() {
    if (!fundName || !balance) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('superannuation').insert({
      user_id: userId,
      fund_name: fundName,
      balance: parseFloat(balance),
      member_number: memberNum || null,
      investment_option: investOption || null,
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
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2"><Landmark className="h-4 w-4" />Total Balance</div>
          <p className="text-3xl font-bold">{formatAUD(totalBalance)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-2">Employer YTD</p>
          <p className="text-2xl font-bold text-emerald-500">{formatAUD(totalEmployer)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-2">Personal YTD</p>
          <p className="text-2xl font-bold text-blue-500">{formatAUD(totalPersonal)}</p>
        </div>
      </div>

      {/* Accounts list */}
      <div className="rounded-xl border border-border bg-card">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">Super Funds</h3>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add Fund
          </button>
        </div>
        {accounts.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Landmark className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No super funds added yet</p>
            <button onClick={() => setShowAdd(true)} className="text-sm text-primary hover:underline">Add your super fund →</button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {accounts.map((a) => (
              <div key={a.id} className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-lg">{a.fund_name}</p>
                  {a.member_number && <p className="text-sm text-muted-foreground">Member: {a.member_number}</p>}
                  {a.investment_option && <p className="text-sm text-muted-foreground">Option: {a.investment_option}</p>}
                  {a.balance_date && <p className="text-xs text-muted-foreground">As at {a.balance_date}</p>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-right">
                  <div>
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className="font-bold">{formatAUD(a.balance)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Employer YTD</p>
                    <p className="font-medium text-emerald-500">{formatAUD(a.employer_contributions_ytd)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Personal YTD</p>
                    <p className="font-medium text-blue-500">{formatAUD(a.personal_contributions_ytd)}</p>
                  </div>
                  {(a.insurance_death_cover || a.insurance_tpd_cover) && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Shield className="h-3 w-3" />
                      <span>Insured</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Dialog */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-semibold">Add Super Fund</h2>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-sm font-medium mb-1.5 block">Fund Name *</label>
                <input value={fundName} onChange={(e) => setFundName(e.target.value)} placeholder="Australian Super, REST, Hostplus..."
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium mb-1.5 block">Balance (AUD) *</label>
                  <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="150000"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                <div><label className="text-sm font-medium mb-1.5 block">Balance Date</label>
                  <input type="date" value={balanceDate} onChange={(e) => setBalanceDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium mb-1.5 block">Member Number</label>
                  <input value={memberNum} onChange={(e) => setMemberNum(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                <div><label className="text-sm font-medium mb-1.5 block">Investment Option</label>
                  <input value={investOption} onChange={(e) => setInvestOption(e.target.value)} placeholder="Balanced, Growth..."
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium mb-1.5 block">Employer Contrib YTD</label>
                  <input type="number" value={empContrib} onChange={(e) => setEmpContrib(e.target.value)} placeholder="0"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                <div><label className="text-sm font-medium mb-1.5 block">Personal Contrib YTD</label>
                  <input type="number" value={personalContrib} onChange={(e) => setPersonalContrib(e.target.value)} placeholder="0"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium mb-1.5 block">Death Cover</label>
                  <input type="number" value={deathCover} onChange={(e) => setDeathCover(e.target.value)} placeholder="500000"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                <div><label className="text-sm font-medium mb-1.5 block">TPD Cover</label>
                  <input type="number" value={tpdCover} onChange={(e) => setTpdCover(e.target.value)} placeholder="500000"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || !fundName || !balance}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Fund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
