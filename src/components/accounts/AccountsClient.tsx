'use client'

import { useState, useEffect } from 'react'
import { Plus, CreditCard, X, Loader2, Wallet, Building2, Link2, RefreshCw } from 'lucide-react'
import { formatAUD } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Account } from '@/types'

const INSTITUTIONS_AU = ['Commonwealth Bank', 'ANZ', 'Westpac', 'NAB', 'Macquarie', 'ING', 'Bendigo', 'Other']
const INSTITUTIONS_IN = ['HDFC Bank', 'SBI', 'ICICI', 'Axis Bank', 'Kotak', 'Yes Bank', 'Other']

const TYPE_ICONS: Record<string, React.ReactNode> = {
  savings: <Wallet className="h-5 w-5 text-white" />,
  checking: <CreditCard className="h-5 w-5 text-white" />,
  credit: <CreditCard className="h-5 w-5 text-white" />,
  investment: <Building2 className="h-5 w-5 text-white" />,
}

const TYPE_GRADIENT: Record<string, string> = {
  savings: 'linear-gradient(135deg, #10b981, #059669)',
  checking: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  credit: 'linear-gradient(135deg, #ef4444, #dc2626)',
  investment: 'linear-gradient(135deg, #f59e0b, #d97706)',
}

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

export function AccountsClient({ accounts, userId }: { accounts: Account[]; userId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'savings' as Account['type'], institution: '', currency: 'AUD', balance: '', country: 'AU' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  useEffect(() => {
    const synced = searchParams.get('synced')
    const error = searchParams.get('error')
    if (synced) setSyncMsg(`Successfully synced ${synced} account${synced === '1' ? '' : 's'} from your bank.`)
    if (error) setSyncMsg(`Sync error: ${error.replace(/_/g, ' ')}`)
  }, [searchParams])

  async function handleConnectBank() {
    setConnecting(true)
    try {
      const res = await fetch('/api/saltedge/connect')
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setSyncMsg(data.error ?? 'Failed to get connect URL')
        setConnecting(false)
      }
    } catch {
      setSyncMsg('Failed to connect to bank')
      setConnecting(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    setSyncMsg('')
    try {
      const res = await fetch('/api/saltedge/sync', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setSyncMsg(`Synced ${data.synced} account${data.synced !== 1 ? 's' : ''} from your bank.`)
        router.refresh()
      } else {
        setSyncMsg(data.error ?? 'Sync failed')
      }
    } finally {
      setSyncing(false)
    }
  }

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  const totalAUD = accounts.filter(a => a.currency === 'AUD' && a.type !== 'credit').reduce((s, a) => s + a.balance, 0)
  const totalCredit = accounts.filter(a => a.type === 'credit').reduce((s, a) => s + a.balance, 0)
  const auAccounts = accounts.filter(a => a.country === 'AU').length
  const inAccounts = accounts.filter(a => a.country === 'IN').length

  async function handleSave() {
    if (!form.name) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('accounts').insert({
      user_id: userId, name: form.name, type: form.type,
      institution: form.institution || null, currency: form.currency,
      balance: parseFloat(form.balance) || 0, country: form.country,
    })
    if (error) { setError(error.message); setSaving(false) }
    else { setShowAdd(false); router.refresh() }
  }

  const labelStyle = { color: 'rgba(161,174,255,0.5)' }
  const inputStyle = {
    background: 'rgba(99,102,241,0.06)',
    border: '1.5px solid rgba(99,102,241,0.2)',
    color: 'rgba(220,225,255,0.9)',
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total AUD Balance', value: formatAUD(totalAUD), gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', shadow: 'rgba(99,102,241,0.3)', icon: <Wallet className="h-4 w-4 text-white" /> },
          { label: 'Credit Liabilities', value: formatAUD(totalCredit), gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', shadow: 'rgba(239,68,68,0.3)', icon: <CreditCard className="h-4 w-4 text-white" /> },
          { label: 'AU Accounts', value: String(auAccounts), gradient: 'linear-gradient(135deg, #10b981, #059669)', shadow: 'rgba(16,185,129,0.3)', icon: <Building2 className="h-4 w-4 text-white" /> },
          { label: 'IN Accounts', value: String(inAccounts), gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', shadow: 'rgba(245,158,11,0.3)', icon: <Building2 className="h-4 w-4 text-white" /> },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5 flex flex-col gap-3" style={CARD_STYLE}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={labelStyle}>{s.label}</span>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ background: s.gradient, boxShadow: `0 4px 12px ${s.shadow}` }}>
                {s.icon}
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight" style={{ color: 'rgba(220,225,255,0.9)' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Accounts list */}
      <div className="rounded-2xl overflow-hidden" style={CARD_STYLE}>
        <div className="px-6 py-4 flex items-center justify-between gap-3 flex-wrap"
          style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
          <div>
            <h3 className="font-semibold" style={{ color: 'rgba(220,225,255,0.9)' }}>All Accounts</h3>
            {accounts.length > 0 && (
              <p className="text-xs mt-0.5" style={labelStyle}>{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleConnectBank} disabled={connecting}
              className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs disabled:opacity-50">
              {connecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2 className="h-3 w-3" />}
              Connect 🇦🇺 Bank
            </button>
            <button onClick={handleSync} disabled={syncing}
              className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs disabled:opacity-50">
              {syncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Sync
            </button>
            <button onClick={() => setShowAdd(true)}
              className="btn-gradient flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white">
              <Plus className="h-3 w-3" /> Add Account
            </button>
          </div>
        </div>

        {syncMsg && (
          <div className="px-6 py-3 text-xs" style={{ borderBottom: '1px solid rgba(99,102,241,0.12)', background: 'rgba(99,102,241,0.06)', color: 'rgba(161,174,255,0.7)' }}>
            {syncMsg}
          </div>
        )}

        {accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <p className="font-semibold mb-1" style={{ color: 'rgba(220,225,255,0.9)' }}>No accounts yet</p>
            <p className="text-sm mb-4" style={labelStyle}>Add your bank accounts to track your savings</p>
            <button onClick={() => setShowAdd(true)} className="btn-gradient px-4 py-2 rounded-lg text-sm text-white">
              Add your first account →
            </button>
          </div>
        ) : (
          <div>
            {accounts.map((a) => (
              <div key={a.id} className="px-6 py-4 flex items-center gap-4 transition-colors"
                style={{ borderBottom: '1px solid rgba(99,102,241,0.08)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.05)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
                <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: TYPE_GRADIENT[a.type] || TYPE_GRADIENT.savings }}>
                  {TYPE_ICONS[a.type] || TYPE_ICONS.savings}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" style={{ color: 'rgba(220,225,255,0.9)' }}>{a.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs" style={labelStyle}>
                      {a.institution ? `${a.institution} · ` : ''}<span className="capitalize">{a.type}</span> · {a.country === 'AU' ? '🇦🇺' : a.country === 'IN' ? '🇮🇳' : '🌐'} {a.country}
                    </span>
                    {(a.basiq_account_id || a.saltedge_account_id) && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                        Live
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-lg" style={{ color: a.type === 'credit' ? '#ef4444' : 'rgba(220,225,255,0.9)' }}>
                    {a.currency === 'INR' ? '₹' : 'A$'}{Math.abs(a.balance).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs" style={labelStyle}>{a.currency}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add dialog */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={MODAL_STYLE}>
            <div className="px-6 py-5 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
              <div>
                <h2 className="font-bold text-lg" style={{ color: 'rgba(220,225,255,0.9)' }}>Add Account</h2>
                <p className="text-xs mt-0.5" style={labelStyle}>Connect a bank account to your portfolio</p>
              </div>
              <button onClick={() => setShowAdd(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: 'rgba(161,174,255,0.5)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.1)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={labelStyle}>Account Name *</label>
                <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Savings account, Emergency fund..."
                  className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={labelStyle}>Type</label>
                  <select value={form.type} onChange={(e) => update('type', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark">
                    <option value="savings">Savings</option>
                    <option value="checking">Checking</option>
                    <option value="credit">Credit Card</option>
                    <option value="investment">Investment</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={labelStyle}>Country</label>
                  <select value={form.country} onChange={(e) => { update('country', e.target.value); update('currency', e.target.value === 'IN' ? 'INR' : e.target.value === 'US' ? 'USD' : 'AUD') }}
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark">
                    <option value="AU">🇦🇺 Australia</option>
                    <option value="IN">🇮🇳 India</option>
                    <option value="US">🇺🇸 USA</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={labelStyle}>Institution</label>
                  <select value={form.institution} onChange={(e) => update('institution', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark">
                    <option value="">Select bank</option>
                    {(form.country === 'IN' ? INSTITUTIONS_IN : INSTITUTIONS_AU).map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={labelStyle}>Balance ({form.currency})</label>
                  <input type="number" step="0.01" value={form.balance} onChange={(e) => update('balance', e.target.value)} placeholder="0.00"
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

            <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: '1px solid rgba(99,102,241,0.2)' }}>
              <button onClick={() => setShowAdd(false)} className="btn-ghost px-4 py-2 text-sm rounded-lg">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !form.name}
                className="btn-gradient px-5 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
