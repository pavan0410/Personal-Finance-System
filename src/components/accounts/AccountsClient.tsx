'use client'

import { useState } from 'react'
import { Plus, CreditCard, X, Loader2 } from 'lucide-react'
import { formatAUD } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Account } from '@/types'

const INSTITUTIONS_AU = ['Commonwealth Bank', 'ANZ', 'Westpac', 'NAB', 'Macquarie', 'ING', 'Bendigo', 'Other']
const INSTITUTIONS_IN = ['HDFC Bank', 'SBI', 'ICICI', 'Axis Bank', 'Kotak', 'Yes Bank', 'Other']

export function AccountsClient({ accounts, userId }: { accounts: Account[]; userId: string }) {
  const router = useRouter()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'savings' as Account['type'], institution: '', currency: 'AUD', balance: '', country: 'AU' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  const totalAUD = accounts.filter(a => a.currency === 'AUD' && a.type !== 'credit').reduce((s, a) => s + a.balance, 0)

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-2">Total AUD Balance</p>
          <p className="text-3xl font-bold">{formatAUD(totalAUD)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-2">Accounts</p>
          <p className="text-3xl font-bold">{accounts.length}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">All Accounts</h3>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add Account
          </button>
        </div>
        {accounts.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <CreditCard className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No accounts yet</p>
            <button onClick={() => setShowAdd(true)} className="text-sm text-primary hover:underline">Add your first account →</button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {accounts.map((a) => (
              <div key={a.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{a.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{a.institution ? `${a.institution} · ` : ''}{a.type} · {a.country}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${a.type === 'credit' ? 'text-red-500' : ''}`}>
                    {a.currency === 'INR' ? '₹' : 'A$'}{Math.abs(a.balance).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground">{a.currency}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-semibold">Add Account</h2>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-sm font-medium mb-1.5 block">Account Name *</label>
                <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Savings account, Emergency fund..."
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium mb-1.5 block">Type</label>
                  <select value={form.type} onChange={(e) => update('type', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="savings">Savings</option>
                    <option value="checking">Checking</option>
                    <option value="credit">Credit Card</option>
                    <option value="investment">Investment</option>
                  </select></div>
                <div><label className="text-sm font-medium mb-1.5 block">Country</label>
                  <select value={form.country} onChange={(e) => { update('country', e.target.value); update('currency', e.target.value === 'IN' ? 'INR' : e.target.value === 'US' ? 'USD' : 'AUD') }}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="AU">Australia</option>
                    <option value="IN">India</option>
                    <option value="US">USA</option>
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium mb-1.5 block">Institution</label>
                  <select value={form.institution} onChange={(e) => update('institution', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">Select bank</option>
                    {(form.country === 'IN' ? INSTITUTIONS_IN : INSTITUTIONS_AU).map(b => <option key={b} value={b}>{b}</option>)}
                  </select></div>
                <div><label className="text-sm font-medium mb-1.5 block">Current Balance ({form.currency})</label>
                  <input type="number" step="0.01" value={form.balance} onChange={(e) => update('balance', e.target.value)} placeholder="0.00"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
