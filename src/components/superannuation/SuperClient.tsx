'use client'

import { useState } from 'react'
import { Plus, Landmark, Shield, Loader2, X, TrendingUp, RefreshCw } from 'lucide-react'
import { formatAUD } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Superannuation } from '@/types'

const CARD_STYLE = {
  background: 'rgba(13,16,40,0.8)',
  border: '1px solid rgba(99,102,241,0.15)',
  backdropFilter: 'blur(12px)',
}

const MODAL_STYLE = {
  background: 'rgba(10,12,30,0.95)',
  border: '1px solid rgba(99,102,241,0.25)',
  boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
}

const LABEL_COLOR = { color: 'rgba(161,174,255,0.5)' }
const TEXT_COLOR = { color: 'rgba(220,225,255,0.9)' }

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
  const [updating, setUpdating] = useState<Superannuation | null>(null)
  const [updBalance, setUpdBalance] = useState('')
  const [updEmp, setUpdEmp] = useState('')
  const [updPersonal, setUpdPersonal] = useState('')
  const [updDate, setUpdDate] = useState(new Date().toISOString().split('T')[0])
  const [updSaving, setUpdSaving] = useState(false)

  function openUpdate(a: Superannuation) {
    setUpdating(a)
    setUpdBalance(String(a.balance ?? ''))
    setUpdEmp(String(a.employer_contributions_ytd ?? ''))
    setUpdPersonal(String(a.personal_contributions_ytd ?? ''))
    setUpdDate(new Date().toISOString().split('T')[0])
  }

  async function handleUpdate() {
    if (!updating) return
    setUpdSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('superannuation').update({
      balance: parseFloat(updBalance) || 0,
      employer_contributions_ytd: parseFloat(updEmp) || 0,
      personal_contributions_ytd: parseFloat(updPersonal) || 0,
      balance_date: updDate,
      updated_at: new Date().toISOString(),
    }).eq('id', updating.id)
    setUpdSaving(false)
    if (!error) { setUpdating(null); router.refresh() }
  }

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
          { label: 'Total Balance', value: formatAUD(totalBalance), gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', shadow: 'rgba(99,102,241,0.3)', icon: <Landmark className="h-4 w-4 text-white" /> },
          { label: 'Employer YTD', value: formatAUD(totalEmployer), gradient: 'linear-gradient(135deg, #10b981, #059669)', shadow: 'rgba(16,185,129,0.3)', icon: <TrendingUp className="h-4 w-4 text-white" /> },
          { label: 'Personal YTD', value: formatAUD(totalPersonal), gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', shadow: 'rgba(139,92,246,0.3)', icon: <TrendingUp className="h-4 w-4 text-white" /> },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5 flex flex-col gap-3" style={CARD_STYLE}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={LABEL_COLOR}>{s.label}</span>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ background: s.gradient, boxShadow: `0 4px 12px ${s.shadow}` }}>
                {s.icon}
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight" style={TEXT_COLOR}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Contributions breakdown */}
      {accounts.length > 0 && (
        <div className="rounded-2xl p-5" style={CARD_STYLE}>
          <p className="text-sm font-semibold mb-3" style={TEXT_COLOR}>Contributions YTD Breakdown</p>
          <div className="flex gap-3 mb-2">
            <div className="text-xs" style={LABEL_COLOR}>
              Employer <span className="font-semibold" style={TEXT_COLOR}>{formatAUD(totalEmployer)}</span>
            </div>
            <div className="text-xs" style={LABEL_COLOR}>
              Personal <span className="font-semibold" style={TEXT_COLOR}>{formatAUD(totalPersonal)}</span>
            </div>
          </div>
          <div className="h-3 rounded-full overflow-hidden flex" style={{ background: 'rgba(99,102,241,0.12)' }}>
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
      <div className="rounded-2xl overflow-hidden" style={CARD_STYLE}>
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
          <div>
            <h3 className="font-semibold" style={TEXT_COLOR}>Super Funds</h3>
            {accounts.length > 0 && <p className="text-xs mt-0.5" style={LABEL_COLOR}>{accounts.length} fund{accounts.length !== 1 ? 's' : ''}</p>}
          </div>
          <button onClick={() => setShowAdd(true)}
            className="btn-gradient flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white">
            <Plus className="h-3 w-3" /> Add Fund
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
              <Landmark className="h-8 w-8 text-white" />
            </div>
            <p className="font-semibold mb-1" style={TEXT_COLOR}>No super funds added</p>
            <p className="text-sm mb-4" style={LABEL_COLOR}>Track your superannuation balance and contributions</p>
            <button onClick={() => setShowAdd(true)} className="btn-gradient px-4 py-2 rounded-lg text-sm text-white">
              Add your super fund &rarr;
            </button>
          </div>
        ) : (
          <div>
            {accounts.map((a) => (
              <div key={a.id} className="p-6 transition-colors"
                style={{ borderBottom: '1px solid rgba(99,102,241,0.08)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.03)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    <Landmark className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-lg" style={TEXT_COLOR}>{a.fund_name}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs" style={LABEL_COLOR}>
                      {a.member_number && <span>Member: {a.member_number}</span>}
                      {a.investment_option && <span>Option: {a.investment_option}</span>}
                      {a.balance_date && <span>As at {a.balance_date}</span>}
                    </div>
                  </div>
                  <button onClick={() => openUpdate(a)}
                    className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs shrink-0">
                    <RefreshCw className="h-3 w-3" /> Update Balance
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-xl p-3" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)' }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={LABEL_COLOR}>Balance</p>
                    <p className="font-bold" style={TEXT_COLOR}>{formatAUD(a.balance)}</p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.12)' }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#10b981' }}>Employer YTD</p>
                    <p className="font-bold text-emerald-500">{formatAUD(a.employer_contributions_ytd)}</p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.12)' }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#818cf8' }}>Personal YTD</p>
                    <p className="font-bold" style={{ color: '#818cf8' }}>{formatAUD(a.personal_contributions_ytd)}</p>
                  </div>
                  {(a.insurance_death_cover || a.insurance_tpd_cover) && (
                    <div className="rounded-xl p-3" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.12)' }}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1 flex items-center gap-1" style={{ color: '#8b5cf6' }}>
                        <Shield className="h-2.5 w-2.5" /> Insurance
                      </p>
                      {a.insurance_death_cover && <p className="text-xs" style={TEXT_COLOR}>Death: {formatAUD(a.insurance_death_cover)}</p>}
                      {a.insurance_tpd_cover && <p className="text-xs" style={TEXT_COLOR}>TPD: {formatAUD(a.insurance_tpd_cover)}</p>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Update dialog */}
      {updating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={MODAL_STYLE}>
            <div className="px-6 py-5 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
              <div>
                <h2 className="font-bold text-lg" style={TEXT_COLOR}>Update Balance</h2>
                <p className="text-xs mt-0.5" style={LABEL_COLOR}>{updating.fund_name}</p>
              </div>
              <button onClick={() => setUpdating(null)}
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ color: 'rgba(161,174,255,0.5)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.1)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>New Balance (AUD)</label>
                  <input type="number" value={updBalance} onChange={e => setUpdBalance(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>As At Date</label>
                  <input type="date" value={updDate} onChange={e => setUpdDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Employer YTD</label>
                  <input type="number" value={updEmp} onChange={e => setUpdEmp(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Personal YTD</label>
                  <input type="number" value={updPersonal} onChange={e => setUpdPersonal(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: '1px solid rgba(99,102,241,0.2)' }}>
              <button onClick={() => setUpdating(null)} className="btn-ghost px-4 py-2 text-sm rounded-lg">
                Cancel
              </button>
              <button onClick={handleUpdate} disabled={updSaving || !updBalance}
                className="btn-gradient px-5 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50 flex items-center gap-2">
                {updSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Save Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add dialog */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-lg rounded-2xl max-h-[90vh] flex flex-col" style={MODAL_STYLE}>
            <div className="px-6 py-5 flex items-center justify-between sticky top-0 z-10"
              style={{ borderBottom: '1px solid rgba(99,102,241,0.2)', background: 'rgba(10,12,30,0.98)' }}>
              <div>
                <h2 className="font-bold text-lg" style={TEXT_COLOR}>Add Super Fund</h2>
                <p className="text-xs mt-0.5" style={LABEL_COLOR}>Track your superannuation details</p>
              </div>
              <button onClick={() => setShowAdd(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ color: 'rgba(161,174,255,0.5)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.1)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Fund Name *</label>
                <input value={fundName} onChange={(e) => setFundName(e.target.value)} placeholder="Australian Super, REST, Hostplus..."
                  className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Balance (AUD) *</label>
                  <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="150000"
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Balance Date</label>
                  <input type="date" value={balanceDate} onChange={(e) => setBalanceDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Member Number</label>
                  <input value={memberNum} onChange={(e) => setMemberNum(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Investment Option</label>
                  <input value={investOption} onChange={(e) => setInvestOption(e.target.value)} placeholder="Balanced, Growth..."
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Employer Contrib YTD</label>
                  <input type="number" value={empContrib} onChange={(e) => setEmpContrib(e.target.value)} placeholder="0"
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Personal Contrib YTD</label>
                  <input type="number" value={personalContrib} onChange={(e) => setPersonalContrib(e.target.value)} placeholder="0"
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Insurance Coverage</label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" value={deathCover} onChange={(e) => setDeathCover(e.target.value)} placeholder="Death cover"
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                  <input type="number" value={tpdCover} onChange={(e) => setTpdCover(e.target.value)} placeholder="TPD cover"
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
              </div>
              {error && (
                <div className="text-sm px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                  {error}
                </div>
              )}
            </div>
            <div className="px-6 py-4 flex justify-end gap-3 sticky bottom-0"
              style={{ borderTop: '1px solid rgba(99,102,241,0.2)', background: 'rgba(10,12,30,0.98)' }}>
              <button onClick={() => setShowAdd(false)} className="btn-ghost px-4 py-2 text-sm rounded-lg">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !fundName || !balance}
                className="btn-gradient px-5 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Fund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
