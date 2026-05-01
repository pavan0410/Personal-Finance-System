'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Account } from '@/types'

const CATEGORIES = ['Food', 'Transport', 'Utilities', 'Healthcare', 'Entertainment', 'Shopping', 'Rent', 'Salary', 'Investment', 'Transfer', 'Other']

interface Props {
  accounts: Pick<Account, 'id' | 'name' | 'currency'>[]
  userId: string
  onClose: () => void
}

const MODAL_STYLE = {
  background: 'rgba(10,12,30,0.95)',
  border: '1px solid rgba(99,102,241,0.25)',
  boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
}

const LABEL_COLOR = { color: 'rgba(161,174,255,0.5)' }
const TEXT_COLOR = { color: 'rgba(220,225,255,0.9)' }

const TYPE_ACTIVE: Record<string, { background: string; color: string }> = {
  expense: { background: 'rgba(239,68,68,0.15)', color: '#fca5a5' },
  income: { background: 'rgba(16,185,129,0.15)', color: '#6ee7b7' },
  transfer: { background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' },
}

export function AddTransactionDialog({ accounts, userId, onClose }: Props) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense')
  const [category, setCategory] = useState('')
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!description || !amount) return
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.from('transactions').insert({
      user_id: userId,
      account_id: accountId || null,
      date,
      description,
      amount: parseFloat(amount),
      currency: accounts.find(a => a.id === accountId)?.currency ?? 'AUD',
      type,
      category: category || null,
      notes: notes || null,
    })
    if (error) { setError(error.message); setSaving(false) }
    else onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={MODAL_STYLE}>
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
          <div>
            <h2 className="font-bold text-lg" style={TEXT_COLOR}>Add Transaction</h2>
            <p className="text-xs mt-0.5" style={LABEL_COLOR}>Record a new transaction</p>
          </div>
          <button onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'rgba(161,174,255,0.5)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.1)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Type selector */}
          <div className="grid grid-cols-3 gap-1 rounded-xl p-1"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
            {(['expense', 'income', 'transfer'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className="py-1.5 rounded-lg text-sm font-medium capitalize transition-all"
                style={type === t ? TYPE_ACTIVE[t] : { color: 'rgba(161,174,255,0.5)' }}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Amount (AUD)</label>
              <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
                className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Description *</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Coles grocery shopping"
              className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-lg text-sm input-dark">
                <option value="">Select...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Account</label>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg text-sm input-dark">
                <option value="">No account</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional notes..."
              className="w-full px-3 py-2 rounded-lg text-sm resize-none input-dark" />
          </div>

          {error && (
            <div className="text-sm px-3 py-2.5 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: '1px solid rgba(99,102,241,0.2)' }}>
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm rounded-lg">Cancel</button>
          <button onClick={handleSave} disabled={saving || !description || !amount}
            className="btn-gradient px-5 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50 flex items-center gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  )
}
