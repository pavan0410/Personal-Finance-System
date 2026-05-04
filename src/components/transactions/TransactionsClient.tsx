'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Upload, Search, Trash2, Pencil, ChevronLeft, ChevronRight,
  X, Check, Wallet, LayoutDashboard, Tag, Loader2, AlertCircle,
} from 'lucide-react'
import { formatAUD } from '@/lib/utils'
import { AddTransactionDialog } from './AddTransactionDialog'
import type { Transaction, Account, BudgetCategory, SavingsBalance } from '@/types'

// ── Constants ──────────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#14b8a6', '#6b7280',
]

const PRESET_EMOJIS = [
  '💰','🍔','🚗','⚡','🏥','🎬','🛍️','📈','🛡️','💼',
  '🏠','✈️','📱','🎁','💡','🏋️','☕','🎵','🎓','🐾',
]

// ── Style helpers ──────────────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  background: 'rgba(13,16,40,0.8)',
  border: '1px solid rgba(99,102,241,0.15)',
  backdropFilter: 'blur(12px)',
}
const LABEL_CLR = 'rgba(161,174,255,0.5)'
const TEXT_CLR = 'rgba(220,225,255,0.9)'
const inputStyle: React.CSSProperties = {
  height: '36px',
  padding: '0 12px',
  borderRadius: '10px',
  background: 'rgba(99,102,241,0.08)',
  border: '1px solid rgba(99,102,241,0.2)',
  color: TEXT_CLR,
  fontSize: '13px',
  outline: 'none',
  width: '100%',
}

// ── Month helpers ──────────────────────────────────────────────────────────────

function currentYM(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function prevMonth(m: string): string {
  const [y, mo] = m.split('-').map(Number)
  return mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, '0')}`
}
function nextMonth(m: string): string {
  const [y, mo] = m.split('-').map(Number)
  return mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`
}
function fmtMonth(m: string): string {
  const [y, mo] = m.split('-').map(Number)
  return new Date(y, mo - 1, 1).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
}

// ── Interfaces ─────────────────────────────────────────────────────────────────

interface Props {
  transactions: Transaction[]
  categories: BudgetCategory[]
  savingsBalance: SavingsBalance | null
  accounts: Pick<Account, 'id' | 'name' | 'currency'>[]
  userId: string
}

type Tab = 'budget' | 'transactions' | 'categories'

interface CatForm {
  name: string; emoji: string; color: string; monthly_budget: string; is_income: boolean
}

const emptyCatForm = (): CatForm => ({
  name: '', emoji: '💰', color: '#6366f1', monthly_budget: '', is_income: false,
})

// ── Component ──────────────────────────────────────────────────────────────────

export function TransactionsClient({
  transactions: initTx,
  categories: initCats,
  savingsBalance: initSavings,
  accounts,
  userId,
}: Props) {
  const router = useRouter()

  // ── Core state ────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>('budget')
  const [selectedMonth, setSelectedMonth] = useState(currentYM())
  const [txList, setTxList] = useState<Transaction[]>(initTx)
  const [cats, setCats] = useState<BudgetCategory[]>(initCats)
  const [savings, setSavings] = useState<SavingsBalance | null>(initSavings)

  // ── Transactions tab state ────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [editTxForm, setEditTxForm] = useState<{ description: string; amount: string; category: string; type: Transaction['type']; date: string }>(
    { description: '', amount: '', category: '', type: 'expense', date: '' }
  )
  const [savingTx, setSavingTx] = useState(false)

  // ── Categories tab state ──────────────────────────────────────────────────
  const [editingCat, setEditingCat] = useState<BudgetCategory | null>(null)
  const [editCatForm, setEditCatForm] = useState<CatForm>(emptyCatForm())
  const [showAddCat, setShowAddCat] = useState(false)
  const [newCatForm, setNewCatForm] = useState<CatForm>(emptyCatForm())
  const [seedingDefaults, setSeedingDefaults] = useState(false)

  // ── Savings balance state ─────────────────────────────────────────────────
  const [showSavingsForm, setShowSavingsForm] = useState(false)
  const [savingsForm, setSavingsForm] = useState({ balance: '', as_of_date: new Date().toISOString().split('T')[0] })
  const [savingBalance, setSavingBalance] = useState(false)

  // ── Error ─────────────────────────────────────────────────────────────────
  const [error, setError] = useState('')

  // ── Computed ──────────────────────────────────────────────────────────────
  const monthTx = useMemo(
    () => txList.filter(t => t.date.startsWith(selectedMonth)),
    [txList, selectedMonth]
  )

  const monthStats = useMemo(() => {
    const stats: Record<string, number> = {}
    monthTx.forEach(t => {
      if (t.type === 'expense' && t.category) {
        stats[t.category] = (stats[t.category] ?? 0) + t.amount
      }
    })
    return stats
  }, [monthTx])

  const monthIncome = useMemo(() => monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [monthTx])
  const monthExpense = useMemo(() => monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [monthTx])

  const filteredTx = useMemo(() => {
    const s = search.toLowerCase()
    return monthTx.filter(t =>
      !s || t.description.toLowerCase().includes(s) || (t.category ?? '').toLowerCase().includes(s)
    )
  }, [monthTx, search])

  const catNames = useMemo(() => cats.map(c => c.name), [cats])

  // ── API helpers ───────────────────────────────────────────────────────────

  async function apiDelete(url: string) {
    const res = await fetch(url, { method: 'DELETE' })
    if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Delete failed') }
  }

  async function apiPatch(url: string, body: Record<string, unknown>) {
    const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Update failed') }
    return res.json()
  }

  async function apiPost(url: string, body: Record<string, unknown>) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Request failed') }
    return res.json()
  }

  // ── Transaction actions ───────────────────────────────────────────────────

  async function deleteTx(id: string) {
    if (!confirm('Delete this transaction?')) return
    try {
      await apiDelete(`/api/transactions/${id}`)
      setTxList(prev => prev.filter(t => t.id !== id))
    } catch (e) { setError(String(e)) }
  }

  async function updateTxCategory(id: string, category: string) {
    try {
      await apiPatch(`/api/transactions/${id}`, { category })
      setTxList(prev => prev.map(t => t.id === id ? { ...t, category } : t))
    } catch (e) { setError(String(e)) }
  }

  function openEditTx(t: Transaction) {
    setEditingTx(t)
    setEditTxForm({ description: t.description, amount: String(t.amount), category: t.category ?? '', type: t.type as Transaction['type'], date: t.date })
    setError('')
  }

  async function saveEditTx() {
    if (!editingTx) return
    setSavingTx(true)
    try {
      await apiPatch(`/api/transactions/${editingTx.id}`, {
        description: editTxForm.description,
        amount: parseFloat(editTxForm.amount),
        category: editTxForm.category || null,
        type: editTxForm.type,
        date: editTxForm.date,
      })
      setTxList(prev => prev.map(t => t.id === editingTx.id
        ? { ...t, ...editTxForm, amount: parseFloat(editTxForm.amount) }
        : t
      ))
      setEditingTx(null)
    } catch (e) { setError(String(e)) } finally { setSavingTx(false) }
  }

  // ── Category actions ──────────────────────────────────────────────────────

  async function seedDefaults() {
    setSeedingDefaults(true)
    try {
      const data = await apiPost('/api/budget-categories', { seed_defaults: true })
      setCats(data.categories ?? [])
    } catch (e) { setError(String(e)) } finally { setSeedingDefaults(false) }
  }

  async function addCategory() {
    if (!newCatForm.name.trim()) return
    try {
      const data = await apiPost('/api/budget-categories', {
        name: newCatForm.name.trim(),
        emoji: newCatForm.emoji,
        color: newCatForm.color,
        monthly_budget: parseFloat(newCatForm.monthly_budget) || 0,
        is_income: newCatForm.is_income,
      })
      setCats(prev => [...prev, data.category])
      setNewCatForm(emptyCatForm())
      setShowAddCat(false)
    } catch (e) { setError(String(e)) }
  }

  function openEditCat(c: BudgetCategory) {
    setEditingCat(c)
    setEditCatForm({ name: c.name, emoji: c.emoji, color: c.color, monthly_budget: String(c.monthly_budget), is_income: c.is_income })
    setError('')
  }

  async function saveEditCat() {
    if (!editingCat) return
    try {
      const data = await apiPatch(`/api/budget-categories/${editingCat.id}`, {
        name: editCatForm.name.trim(),
        emoji: editCatForm.emoji,
        color: editCatForm.color,
        monthly_budget: parseFloat(editCatForm.monthly_budget) || 0,
        is_income: editCatForm.is_income,
      })
      setCats(prev => prev.map(c => c.id === editingCat.id ? data.category : c))
      setEditingCat(null)
    } catch (e) { setError(String(e)) }
  }

  async function deleteCat(id: string) {
    if (!confirm('Delete this category? Transactions will keep their category label.')) return
    try {
      await apiDelete(`/api/budget-categories/${id}`)
      setCats(prev => prev.filter(c => c.id !== id))
    } catch (e) { setError(String(e)) }
  }

  // ── Savings balance actions ───────────────────────────────────────────────

  async function saveSavingsBalance() {
    if (!savingsForm.balance || !savingsForm.as_of_date) return
    setSavingBalance(true)
    try {
      const data = await apiPost('/api/savings-balance', {
        balance: parseFloat(savingsForm.balance),
        as_of_date: savingsForm.as_of_date,
      })
      setSavings(data.savingsBalance)
      setShowSavingsForm(false)
    } catch (e) { setError(String(e)) } finally { setSavingBalance(false) }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'budget', label: 'Budget', icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
    { id: 'transactions', label: 'Transactions', icon: <Wallet className="h-3.5 w-3.5" /> },
    { id: 'categories', label: 'Categories', icon: <Tag className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="space-y-4">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 text-sm rounded-xl p-3"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button className="ml-auto" onClick={() => setError('')}><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Tab bar + month selector */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(13,16,40,0.8)', border: '1px solid rgba(99,102,241,0.15)' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style={tab === t.id ? {
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                boxShadow: '0 2px 12px rgba(99,102,241,0.4)',
              } : { color: LABEL_CLR }}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Month navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedMonth(prevMonth(selectedMonth))}
            className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'rgba(99,102,241,0.08)', color: LABEL_CLR }}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold min-w-[130px] text-center" style={{ color: TEXT_CLR }}>
            {fmtMonth(selectedMonth)}
          </span>
          <button
            onClick={() => setSelectedMonth(nextMonth(selectedMonth))}
            className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'rgba(99,102,241,0.08)', color: LABEL_CLR }}>
            <ChevronRight className="h-4 w-4" />
          </button>
          {selectedMonth !== currentYM() && (
            <button
              onClick={() => setSelectedMonth(currentYM())}
              className="text-xs px-2.5 py-1 rounded-lg font-semibold"
              style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
              Today
            </button>
          )}
        </div>
      </div>

      {/* ─── BUDGET TAB ─────────────────────────────────────────────────────── */}
      {tab === 'budget' && (
        <div className="space-y-4">
          {/* Savings baseline + month summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Savings balance card */}
            <div className="rounded-2xl p-5 sm:col-span-2 lg:col-span-1" style={CARD}>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: LABEL_CLR }}>
                Savings Balance
              </p>
              {savings ? (
                <>
                  <p className="text-2xl font-black mb-1" style={{ color: '#34d399' }}>
                    {formatAUD(savings.balance)}
                  </p>
                  <p className="text-xs mb-3" style={{ color: LABEL_CLR }}>
                    as of {new Date(savings.as_of_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <button
                    onClick={() => { setSavingsForm({ balance: String(savings.balance), as_of_date: savings.as_of_date }); setShowSavingsForm(true) }}
                    className="text-xs font-semibold transition-colors"
                    style={{ color: '#818cf8' }}>
                    Update balance →
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm mb-3" style={{ color: LABEL_CLR }}>No starting balance set</p>
                  <button
                    onClick={() => { setSavingsForm({ balance: '', as_of_date: new Date().toISOString().split('T')[0] }); setShowSavingsForm(true) }}
                    className="text-xs font-semibold transition-colors"
                    style={{ color: '#818cf8' }}>
                    Set starting balance →
                  </button>
                </>
              )}
            </div>

            {/* Month summary cards */}
            {[
              { label: 'Income', value: monthIncome, color: '#34d399' },
              { label: 'Expenses', value: monthExpense, color: '#f87171' },
              { label: 'Net', value: monthIncome - monthExpense, color: monthIncome >= monthExpense ? '#34d399' : '#f87171' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-2xl p-5" style={CARD}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: LABEL_CLR }}>{label}</p>
                <p className="text-2xl font-black" style={{ color }}>{formatAUD(value)}</p>
              </div>
            ))}
          </div>

          {/* Savings balance modal */}
          {showSavingsForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
              <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={CARD}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold" style={{ color: TEXT_CLR }}>
                    {savings ? 'Update Starting Balance' : 'Set Starting Balance'}
                  </h3>
                  <button onClick={() => setShowSavingsForm(false)}>
                    <X className="h-4 w-4" style={{ color: LABEL_CLR }} />
                  </button>
                </div>
                <p className="text-xs" style={{ color: LABEL_CLR }}>
                  Enter your savings account balance as of a specific date. This is a one-time setup.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: LABEL_CLR }}>Balance (AUD)</label>
                    <input
                      type="number"
                      value={savingsForm.balance}
                      onChange={e => setSavingsForm(f => ({ ...f, balance: e.target.value }))}
                      placeholder="e.g. 12500"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: LABEL_CLR }}>As of Date</label>
                    <input
                      type="date"
                      value={savingsForm.as_of_date}
                      onChange={e => setSavingsForm(f => ({ ...f, as_of_date: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <button
                  onClick={saveSavingsBalance}
                  disabled={savingBalance || !savingsForm.balance}
                  className="w-full py-2 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 btn-gradient disabled:opacity-50">
                  {savingBalance && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Balance
                </button>
              </div>
            </div>
          )}

          {/* Budget bars */}
          {cats.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={CARD}>
              <p className="text-sm mb-4" style={{ color: LABEL_CLR }}>No categories set up yet.</p>
              <button
                onClick={async () => { setTab('categories'); await seedDefaults() }}
                className="btn-gradient text-sm font-semibold px-5 py-2 rounded-xl text-white">
                Set up default categories
              </button>
            </div>
          ) : (
            <div className="rounded-2xl p-6" style={CARD}>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-5" style={{ color: LABEL_CLR }}>
                Budget vs Actual — {fmtMonth(selectedMonth)}
              </h3>
              <div className="space-y-5">
                {cats.filter(c => !c.is_income).map(cat => {
                  const actual = monthStats[cat.name] ?? 0
                  const budget = cat.monthly_budget
                  const pct = budget > 0 ? Math.min(100, (actual / budget) * 100) : 0
                  const over = budget > 0 && actual > budget
                  const barColor = over ? '#ef4444' : pct > 80 ? '#f59e0b' : cat.color
                  return (
                    <div key={cat.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{cat.emoji}</span>
                          <span className="text-sm font-semibold" style={{ color: TEXT_CLR }}>{cat.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold tabular-nums" style={{ color: over ? '#f87171' : TEXT_CLR }}>
                            {formatAUD(actual)}
                          </span>
                          {budget > 0 && (
                            <span className="text-xs ml-1" style={{ color: LABEL_CLR }}>/ {formatAUD(budget)}</span>
                          )}
                        </div>
                      </div>
                      {budget > 0 ? (
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.1)' }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: barColor, boxShadow: `0 0 6px ${barColor}60` }}
                          />
                        </div>
                      ) : (
                        <p className="text-xs" style={{ color: LABEL_CLR }}>No budget set</p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Income categories */}
              {cats.some(c => c.is_income) && (
                <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(99,102,241,0.12)' }}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: LABEL_CLR }}>Income</p>
                  {cats.filter(c => c.is_income).map(cat => (
                    <div key={cat.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{cat.emoji}</span>
                        <span className="text-sm font-semibold" style={{ color: TEXT_CLR }}>{cat.name}</span>
                      </div>
                      <span className="text-sm font-bold tabular-nums" style={{ color: '#34d399' }}>
                        +{formatAUD(monthTx.filter(t => t.type === 'income' && t.category === cat.name).reduce((s, t) => s + t.amount, 0))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── TRANSACTIONS TAB ───────────────────────────────────────────────── */}
      {tab === 'transactions' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: LABEL_CLR }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search transactions..."
                style={{ ...inputStyle, paddingLeft: '36px' }}
              />
            </div>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => router.push('/transactions/import')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm btn-ghost transition-all">
                <Upload className="h-3.5 w-3.5" /> Import CSV
              </button>
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold btn-gradient text-white">
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Income', value: monthIncome, color: '#34d399' },
              { label: 'Expenses', value: monthExpense, color: '#f87171' },
              { label: 'Net', value: monthIncome - monthExpense, color: monthIncome >= monthExpense ? '#34d399' : '#f87171' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-2xl p-4" style={CARD}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: LABEL_CLR }}>{label}</p>
                <p className="text-lg font-black" style={{ color }}>{formatAUD(value)}</p>
              </div>
            ))}
          </div>

          {/* Transactions table */}
          <div className="rounded-2xl overflow-hidden" style={CARD}>
            {filteredTx.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm mb-3" style={{ color: LABEL_CLR }}>
                  No transactions in {fmtMonth(selectedMonth)}
                </p>
                <button onClick={() => setShowAdd(true)} className="text-sm font-semibold" style={{ color: '#818cf8' }}>
                  Add your first transaction →
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.12)', background: 'rgba(99,102,241,0.04)' }}>
                      {['Date', 'Description', 'Category', 'Type', 'Amount', ''].map((h, i) => (
                        <th key={i}
                          className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider ${i >= 4 ? 'text-right' : 'text-left'}`}
                          style={{ color: LABEL_CLR }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTx.map(t => (
                      <tr key={t.id}
                        className="group transition-colors"
                        style={{ borderBottom: '1px solid rgba(99,102,241,0.08)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.04)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: LABEL_CLR }}>{t.date}</td>
                        <td className="px-4 py-3 max-w-[200px]">
                          <p className="truncate font-medium" style={{ color: TEXT_CLR }}>{t.description}</p>
                        </td>
                        {/* Inline category select */}
                        <td className="px-4 py-3">
                          <select
                            value={t.category ?? ''}
                            onChange={e => updateTxCategory(t.id, e.target.value)}
                            className="text-xs rounded-full px-2.5 py-1 cursor-pointer focus:outline-none"
                            style={{
                              background: 'rgba(99,102,241,0.12)',
                              border: '1px solid rgba(99,102,241,0.2)',
                              color: 'rgba(165,180,252,0.8)',
                              appearance: 'none',
                            }}>
                            <option value="">Uncategorised</option>
                            {catNames.map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            t.type === 'income' ? 'badge-income' : t.type === 'expense' ? 'badge-expense' : 'badge-transfer'
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right font-bold tabular-nums ${
                          t.type === 'expense' ? 'text-negative' : 'text-positive'
                        }`}>
                          {t.type === 'expense' ? '-' : '+'}{formatAUD(t.amount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditTx(t)}
                              className="h-6 w-6 rounded-md flex items-center justify-center transition-colors"
                              style={{ color: LABEL_CLR }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#818cf8'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = LABEL_CLR}>
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => deleteTx(t.id)}
                              className="h-6 w-6 rounded-md flex items-center justify-center transition-colors"
                              style={{ color: LABEL_CLR }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#f87171'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = LABEL_CLR}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── CATEGORIES TAB ─────────────────────────────────────────────────── */}
      {tab === 'categories' && (
        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden" style={CARD}>
            {/* Header */}
            <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: LABEL_CLR }}>
                Budget Categories ({cats.length})
              </h3>
              <div className="flex gap-2">
                {cats.length === 0 && (
                  <button
                    onClick={seedDefaults}
                    disabled={seedingDefaults}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg btn-ghost transition-all"
                    style={{ color: '#818cf8' }}>
                    {seedingDefaults ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    Load defaults
                  </button>
                )}
                <button
                  onClick={() => { setShowAddCat(true); setNewCatForm(emptyCatForm()) }}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg btn-gradient text-white font-semibold">
                  <Plus className="h-3.5 w-3.5" /> Add category
                </button>
              </div>
            </div>

            {cats.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm" style={{ color: LABEL_CLR }}>No categories yet</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'rgba(99,102,241,0.08)' }}>
                {cats.map(cat => (
                  <div key={cat.id}>
                    {editingCat?.id === cat.id ? (
                      /* Inline edit form */
                      <div className="p-4 space-y-3" style={{ background: 'rgba(99,102,241,0.04)' }}>
                        <div className="grid grid-cols-2 gap-3">
                          {/* Emoji picker */}
                          <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: LABEL_CLR }}>Emoji</label>
                            <div className="flex flex-wrap gap-1.5 p-2 rounded-lg" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                              {PRESET_EMOJIS.map(e => (
                                <button
                                  key={e}
                                  onClick={() => setEditCatForm(f => ({ ...f, emoji: e }))}
                                  className="text-lg h-8 w-8 rounded-md flex items-center justify-center transition-all"
                                  style={editCatForm.emoji === e ? { background: 'rgba(99,102,241,0.3)' } : {}}>
                                  {e}
                                </button>
                              ))}
                            </div>
                          </div>
                          {/* Color picker */}
                          <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: LABEL_CLR }}>Color</label>
                            <div className="flex flex-wrap gap-1.5 p-2 rounded-lg" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                              {PRESET_COLORS.map(c => (
                                <button
                                  key={c}
                                  onClick={() => setEditCatForm(f => ({ ...f, color: c }))}
                                  className="h-7 w-7 rounded-full border-2 transition-all"
                                  style={{ background: c, borderColor: editCatForm.color === c ? 'white' : 'transparent' }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: LABEL_CLR }}>Name</label>
                            <input
                              type="text"
                              value={editCatForm.name}
                              onChange={e => setEditCatForm(f => ({ ...f, name: e.target.value }))}
                              style={inputStyle}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: LABEL_CLR }}>Monthly Budget</label>
                            <input
                              type="number"
                              value={editCatForm.monthly_budget}
                              onChange={e => setEditCatForm(f => ({ ...f, monthly_budget: e.target.value }))}
                              placeholder="0 = no limit"
                              style={inputStyle}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: TEXT_CLR }}>
                            <input
                              type="checkbox"
                              checked={editCatForm.is_income}
                              onChange={e => setEditCatForm(f => ({ ...f, is_income: e.target.checked }))}
                              className="rounded"
                            />
                            Income category
                          </label>
                          <div className="ml-auto flex gap-2">
                            <button onClick={() => setEditingCat(null)}
                              className="px-3 py-1.5 rounded-lg text-sm btn-ghost">Cancel</button>
                            <button onClick={saveEditCat}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm btn-gradient text-white font-semibold">
                              <Check className="h-3.5 w-3.5" /> Save
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Category row */
                      <div className="group flex items-center gap-4 px-5 py-3.5 hover:bg-[rgba(99,102,241,0.04)] transition-colors">
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                          style={{ background: `${cat.color}20` }}>
                          {cat.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm" style={{ color: TEXT_CLR }}>{cat.name}</p>
                            {cat.is_income && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold badge-income">income</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right mr-4">
                          {cat.monthly_budget > 0 ? (
                            <>
                              <p className="text-sm font-bold tabular-nums" style={{ color: TEXT_CLR }}>{formatAUD(cat.monthly_budget)}</p>
                              <p className="text-[10px]" style={{ color: LABEL_CLR }}>/ month</p>
                            </>
                          ) : (
                            <p className="text-xs" style={{ color: LABEL_CLR }}>No limit</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditCat(cat)}
                            className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors"
                            style={{ color: LABEL_CLR }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#818cf8'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = LABEL_CLR}>
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => deleteCat(cat.id)}
                            className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors"
                            style={{ color: LABEL_CLR }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#f87171'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = LABEL_CLR}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add category form */}
          {showAddCat && (
            <div className="rounded-2xl p-5 space-y-4" style={CARD}>
              <h3 className="font-bold text-sm" style={{ color: TEXT_CLR }}>New Category</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Emoji */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: LABEL_CLR }}>Emoji</label>
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-lg" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                    {PRESET_EMOJIS.map(e => (
                      <button
                        key={e}
                        onClick={() => setNewCatForm(f => ({ ...f, emoji: e }))}
                        className="text-lg h-8 w-8 rounded-md flex items-center justify-center transition-all"
                        style={newCatForm.emoji === e ? { background: 'rgba(99,102,241,0.3)' } : {}}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Color */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: LABEL_CLR }}>Color</label>
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-lg" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setNewCatForm(f => ({ ...f, color: c }))}
                        className="h-7 w-7 rounded-full border-2 transition-all"
                        style={{ background: c, borderColor: newCatForm.color === c ? 'white' : 'transparent' }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: LABEL_CLR }}>Category Name</label>
                  <input
                    type="text"
                    value={newCatForm.name}
                    onChange={e => setNewCatForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Groceries"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: LABEL_CLR }}>Monthly Budget</label>
                  <input
                    type="number"
                    value={newCatForm.monthly_budget}
                    onChange={e => setNewCatForm(f => ({ ...f, monthly_budget: e.target.value }))}
                    placeholder="0 = no limit"
                    style={inputStyle}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: TEXT_CLR }}>
                  <input
                    type="checkbox"
                    checked={newCatForm.is_income}
                    onChange={e => setNewCatForm(f => ({ ...f, is_income: e.target.checked }))}
                    className="rounded"
                  />
                  Income category
                </label>
                <div className="flex gap-2">
                  <button onClick={() => setShowAddCat(false)} className="px-3 py-1.5 rounded-lg text-sm btn-ghost">
                    Cancel
                  </button>
                  <button
                    onClick={addCategory}
                    disabled={!newCatForm.name.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm btn-gradient text-white font-semibold disabled:opacity-50">
                    <Check className="h-3.5 w-3.5" /> Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Edit Transaction Modal ─────────────────────────────────────────── */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={CARD}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold" style={{ color: TEXT_CLR }}>Edit Transaction</h3>
              <button onClick={() => setEditingTx(null)}>
                <X className="h-4 w-4" style={{ color: LABEL_CLR }} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: LABEL_CLR }}>Date</label>
                <input type="date" value={editTxForm.date}
                  onChange={e => setEditTxForm(f => ({ ...f, date: e.target.value }))}
                  style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: LABEL_CLR }}>Description</label>
                <input type="text" value={editTxForm.description}
                  onChange={e => setEditTxForm(f => ({ ...f, description: e.target.value }))}
                  style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: LABEL_CLR }}>Amount (AUD)</label>
                  <input type="number" value={editTxForm.amount}
                    onChange={e => setEditTxForm(f => ({ ...f, amount: e.target.value }))}
                    style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: LABEL_CLR }}>Type</label>
                  <select value={editTxForm.type}
                    onChange={e => setEditTxForm(f => ({ ...f, type: e.target.value as Transaction['type'] }))}
                    style={{ ...inputStyle, appearance: 'none' as const }}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: LABEL_CLR }}>Category</label>
                <select value={editTxForm.category}
                  onChange={e => setEditTxForm(f => ({ ...f, category: e.target.value }))}
                  style={{ ...inputStyle, appearance: 'none' as const }}>
                  <option value="">Uncategorised</option>
                  {catNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditingTx(null)}
                className="flex-1 py-2 rounded-xl text-sm btn-ghost">Cancel</button>
              <button
                onClick={saveEditTx}
                disabled={savingTx}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-white btn-gradient flex items-center justify-center gap-2 disabled:opacity-50">
                {savingTx && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add Transaction Dialog ─────────────────────────────────────────── */}
      {showAdd && (
        <AddTransactionDialog
          accounts={accounts}
          userId={userId}
          onClose={() => {
            setShowAdd(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
