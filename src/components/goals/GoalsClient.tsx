'use client'

import { useState } from 'react'
import { Plus, Target, X, Loader2 } from 'lucide-react'
import { formatAUD } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Goal } from '@/types'

const CATEGORIES = ['Retirement', 'Home', 'Education', 'Travel', 'Emergency Fund', 'Car', 'Wedding', 'Business', 'Other']

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  low: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
}

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
      user_id: userId,
      name: form.name,
      category: form.category || null,
      target_amount: parseFloat(form.target_amount),
      current_amount: parseFloat(form.current_amount) || 0,
      target_date: form.target_date || null,
      currency: 'AUD',
      priority: form.priority,
      notes: form.notes || null,
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
    return `${Math.floor(days / 365)}y left`
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-2">Active Goals</p>
          <p className="text-3xl font-bold">{goals.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-2">Total Target</p>
          <p className="text-2xl font-bold">{formatAUD(goals.reduce((s, g) => s + g.target_amount, 0))}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-2">Total Saved</p>
          <p className="text-2xl font-bold text-emerald-500">{formatAUD(goals.reduce((s, g) => s + g.current_amount, 0))}</p>
        </div>
      </div>

      {/* Goals grid */}
      <div className="rounded-xl border border-border bg-card">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">Goals</h3>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add Goal
          </button>
        </div>
        {goals.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Target className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No goals set yet</p>
            <button onClick={() => setShowAdd(true)} className="text-sm text-primary hover:underline">Create your first goal →</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y divide-border md:divide-y-0 md:grid-rows-auto">
            {goals.map((g, i) => {
              const pct = Math.min(100, g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0)
              const remaining = g.target_amount - g.current_amount
              return (
                <div key={g.id} className={`p-6 ${i % 2 === 0 && i < goals.length - 1 ? 'md:border-r md:border-border' : ''} border-b border-border last:border-b-0`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{g.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {g.category && <span className="text-xs text-muted-foreground">{g.category}</span>}
                        {g.priority && (
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${PRIORITY_COLORS[g.priority]}`}>
                            {g.priority}
                          </span>
                        )}
                        {g.target_date && (
                          <span className="text-xs text-muted-foreground">{daysUntil(g.target_date)}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-primary">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Saved: <span className="text-foreground font-medium">{formatAUD(g.current_amount)}</span></span>
                    <span className="text-muted-foreground">Need: <span className="text-foreground font-medium">{formatAUD(remaining)}</span></span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Target: {formatAUD(g.target_amount)}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-semibold">Add Goal</h2>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-sm font-medium mb-1.5 block">Goal Name *</label>
                <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Buy a house, Retire early..."
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium mb-1.5 block">Category</label>
                  <select value={form.category} onChange={(e) => update('category', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">Select...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select></div>
                <div><label className="text-sm font-medium mb-1.5 block">Priority</label>
                  <select value={form.priority ?? 'medium'} onChange={(e) => update('priority', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium mb-1.5 block">Target Amount (AUD) *</label>
                  <input type="number" value={form.target_amount} onChange={(e) => update('target_amount', e.target.value)} placeholder="100000"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                <div><label className="text-sm font-medium mb-1.5 block">Already Saved (AUD)</label>
                  <input type="number" value={form.current_amount} onChange={(e) => update('current_amount', e.target.value)} placeholder="0"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
              </div>
              <div><label className="text-sm font-medium mb-1.5 block">Target Date</label>
                <input type="date" value={form.target_date} onChange={(e) => update('target_date', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Notes</label>
                <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" /></div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.target_amount}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
