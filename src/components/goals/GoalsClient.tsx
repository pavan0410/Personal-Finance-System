'use client'

import { useState } from 'react'
import { Plus, Target, X, Loader2, Calendar, Flag } from 'lucide-react'
import { formatAUD } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Goal } from '@/types'

const CATEGORIES = ['Retirement', 'Home', 'Education', 'Travel', 'Emergency Fund', 'Car', 'Wedding', 'Business', 'Other']

const PRIORITY_STYLE: Record<string, { bg: string; color: string }> = {
  high: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
  medium: { bg: 'rgba(245,158,11,0.12)', color: '#d97706' },
  low: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
}

const GOAL_GRADIENTS = [
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #3b82f6, #2563eb)',
  'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  'linear-gradient(135deg, #ec4899, #db2777)',
]

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

export function GoalsClient({ goals, userId }: { goals: Goal[]; userId: string }) {
  const router = useRouter()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    name: '', category: '', target_amount: '', current_amount: '', target_date: '',
    priority: 'medium' as Goal['priority'], notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.name || !form.target_amount) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('goals').insert({
      user_id: userId, name: form.name, category: form.category || null,
      target_amount: parseFloat(form.target_amount),
      current_amount: parseFloat(form.current_amount) || 0,
      target_date: form.target_date || null, currency: 'AUD',
      priority: form.priority, notes: form.notes || null,
    })
    if (error) { setError(error.message); setSaving(false) }
    else { setShowAdd(false); router.refresh() }
  }

  function daysUntil(dateStr: string | null): string {
    if (!dateStr) return ''
    const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
    if (days < 0) return 'Overdue'
    if (days === 0) return 'Today'
    if (days < 365) return `${days}d left`
    return `${Math.floor(days / 365)}y ${Math.floor((days % 365) / 30)}m left`
  }

  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0)
  const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0)
  const overallPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active Goals', value: String(goals.length), gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', shadow: 'rgba(99,102,241,0.3)', icon: <Target className="h-4 w-4 text-white" /> },
          { label: 'Total Target', value: formatAUD(totalTarget), gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', shadow: 'rgba(245,158,11,0.3)', icon: <Flag className="h-4 w-4 text-white" /> },
          { label: 'Total Saved', value: formatAUD(totalSaved), gradient: 'linear-gradient(135deg, #10b981, #059669)', shadow: 'rgba(16,185,129,0.3)', icon: <Target className="h-4 w-4 text-white" /> },
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

      {/* Overall progress bar */}
      {goals.length > 0 && (
        <div className="rounded-2xl p-5" style={CARD_STYLE}>
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-semibold" style={TEXT_COLOR}>Overall Progress</p>
            <span className="text-sm font-bold" style={{ color: '#818cf8' }}>{overallPct.toFixed(1)}%</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.12)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, overallPct)}%`,
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                boxShadow: '0 0 8px rgba(99,102,241,0.5)',
              }} />
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-xs" style={LABEL_COLOR}>Saved: {formatAUD(totalSaved)}</p>
            <p className="text-xs" style={LABEL_COLOR}>Remaining: {formatAUD(totalTarget - totalSaved)}</p>
          </div>
        </div>
      )}

      {/* Goals grid */}
      <div className="rounded-2xl overflow-hidden" style={CARD_STYLE}>
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
          <div>
            <h3 className="font-semibold" style={TEXT_COLOR}>Goals</h3>
            {goals.length > 0 && <p className="text-xs mt-0.5" style={LABEL_COLOR}>{goals.length} goal{goals.length !== 1 ? 's' : ''}</p>}
          </div>
          <button onClick={() => setShowAdd(true)}
            className="btn-gradient flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white">
            <Plus className="h-3 w-3" /> Add Goal
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
              <Target className="h-8 w-8 text-white" />
            </div>
            <p className="font-semibold mb-1" style={TEXT_COLOR}>No goals yet</p>
            <p className="text-sm mb-4" style={LABEL_COLOR}>Set financial goals to track your progress</p>
            <button onClick={() => setShowAdd(true)} className="btn-gradient px-4 py-2 rounded-lg text-sm text-white">
              Create your first goal &rarr;
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2">
            {goals.map((g, i) => {
              const pct = Math.min(100, g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0)
              const remaining = g.target_amount - g.current_amount
              const gradient = GOAL_GRADIENTS[i % GOAL_GRADIENTS.length]
              const timeLeft = daysUntil(g.target_date ?? null)
              const ps = PRIORITY_STYLE[g.priority ?? 'medium']

              return (
                <div key={g.id} className="p-6 transition-colors"
                  style={{
                    borderBottom: '1px solid rgba(99,102,241,0.08)',
                    borderRight: i % 2 === 0 ? '1px solid rgba(99,102,241,0.08)' : 'none',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.03)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: gradient }}>
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold truncate" style={TEXT_COLOR}>{g.name}</p>
                        <span className="text-sm font-bold shrink-0 gradient-text">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {g.category && <span className="text-[11px]" style={LABEL_COLOR}>{g.category}</span>}
                        {g.priority && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize"
                            style={{ background: ps.bg, color: ps.color }}>
                            {g.priority}
                          </span>
                        )}
                        {timeLeft && (
                          <span className="text-[10px] flex items-center gap-0.5" style={LABEL_COLOR}>
                            <Calendar className="h-2.5 w-2.5" />{timeLeft}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(99,102,241,0.12)' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: gradient, boxShadow: '0 0 8px rgba(99,102,241,0.4)' }} />
                  </div>

                  <div className="flex justify-between text-xs">
                    <span style={LABEL_COLOR}>Saved: <span className="font-semibold" style={TEXT_COLOR}>{formatAUD(g.current_amount)}</span></span>
                    <span style={LABEL_COLOR}>Left: <span className="font-semibold" style={TEXT_COLOR}>{formatAUD(remaining)}</span></span>
                  </div>
                  <p className="text-[11px] mt-1" style={LABEL_COLOR}>Target: {formatAUD(g.target_amount)}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={MODAL_STYLE}>
            <div className="px-6 py-5 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
              <div>
                <h2 className="font-bold text-lg" style={TEXT_COLOR}>Add Goal</h2>
                <p className="text-xs mt-0.5" style={LABEL_COLOR}>Set a financial milestone to work towards</p>
              </div>
              <button onClick={() => setShowAdd(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: 'rgba(161,174,255,0.5)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.1)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Goal Name *</label>
                <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Buy a house, Retire early..."
                  className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Category</label>
                  <select value={form.category} onChange={(e) => update('category', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark">
                    <option value="">Select...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Priority</label>
                  <select value={form.priority ?? 'medium'} onChange={(e) => update('priority', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark">
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🔵 Low</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Target (AUD) *</label>
                  <input type="number" value={form.target_amount} onChange={(e) => update('target_amount', e.target.value)} placeholder="100000"
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Already Saved</label>
                  <input type="number" value={form.current_amount} onChange={(e) => update('current_amount', e.target.value)} placeholder="0"
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Target Date</label>
                <input type="date" value={form.target_date} onChange={(e) => update('target_date', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Notes</label>
                <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={2}
                  className="w-full px-3 py-2 rounded-lg text-sm resize-none input-dark" />
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
              <button onClick={handleSave} disabled={saving || !form.name || !form.target_amount}
                className="btn-gradient px-5 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
