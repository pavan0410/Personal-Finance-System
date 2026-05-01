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

const inputStyle = {
  width: '100%',
  height: '40px',
  padding: '0 12px',
  borderRadius: '10px',
  background: 'rgba(99,102,241,0.07)',
  border: '1px solid rgba(99,102,241,0.2)',
  color: 'rgba(220,225,255,0.9)',
  fontSize: '13px',
  outline: 'none',
}

const labelStyle = {
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.12em',
  color: 'rgba(161,174,255,0.5)',
  display: 'block',
  marginBottom: '6px',
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

  const typeColors = {
    expense:  { active: 'rgba(239,68,68,0.25)',   text: '#fca5a5' },
    income:   { active: 'rgba(16,185,129,0.25)',  text: '#6ee7b7' },
    transfer: { active: 'rgba(99,102,241,0.25)',  text: '#a5b4fc' },
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(10,12,30,0.97)',
          border: '1px solid rgba(99,102,241,0.25)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.08)',
        }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
          <h2 className="font-bold text-white">Add Transaction</h2>
          <button onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center transition-all"
            style={{ color: 'rgba(161,174,255,0.5)', background: 'rgba(99,102,241,0.08)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.18)'; (e.currentTarget as HTMLElement).style.color = '#a5b4fc' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)'; (e.currentTarget as HTMLElement).style.color = 'rgba(161,174,255,0.5)' }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Type selector */}
          <div className="grid grid-cols-3 gap-1.5 rounded-xl p-1"
            style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}>
            {(['expense', 'income', 'transfer'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className="py-2 rounded-lg text-xs font-bold capitalize transition-all"
                style={type === t ? {
                  background: typeColors[t].active,
                  color: typeColors[t].text,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                } : {
                  color: 'rgba(161,174,255,0.45)',
                }}>
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                style={inputStyle}
                onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.6)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)' }}
                onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.2)'; (e.currentTarget as HTMLElement).style.boxShadow = '' }} />
            </div>
            <div>
              <label style={labelStyle}>Amount (AUD)</label>
              <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
                style={inputStyle}
                onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.6)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)' }}
                onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.2)'; (e.currentTarget as HTMLElement).style.boxShadow = '' }} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Description *</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Coles grocery shopping"
              style={inputStyle}
              onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.6)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)' }}
              onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.2)'; (e.currentTarget as HTMLElement).style.boxShadow = '' }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' as const, WebkitAppearance: 'none' as const }}>
                <option value="">Select...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Account</label>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' as const, WebkitAppearance: 'none' as const }}>
                <option value="">No account</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional notes..."
              style={{ ...inputStyle, height: 'auto', padding: '8px 12px', resize: 'none' }}
              onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.6)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)' }}
              onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.2)'; (e.currentTarget as HTMLElement).style.boxShadow = '' }} />
          </div>

          {error && (
            <p className="text-xs px-3 py-2 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-end gap-3"
          style={{ borderTop: '1px solid rgba(99,102,241,0.12)' }}>
          <button onClick={onClose}
            className="px-4 py-2 text-sm rounded-xl font-semibold btn-ghost">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !description || !amount}
            className="px-5 py-2 text-sm rounded-xl font-semibold btn-gradient flex items-center gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  )
}
