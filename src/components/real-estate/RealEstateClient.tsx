'use client'

import { useState, useRef } from 'react'
import {
  Plus, Home, X, Loader2, TrendingUp, TrendingDown, DollarSign,
  Receipt, BarChart3, FileDown, Upload, Trash2, CheckCircle2, XCircle,
  Building2, CalendarDays, ExternalLink,
} from 'lucide-react'
import { formatAUD } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { RealEstate, RealEstateExpense, RealEstateIncome } from '@/types'

// ── ATO expense categories ────────────────────────────────────────────────────
const ATO_CATEGORIES: { label: string; deductible: boolean }[] = [
  { label: 'Interest & Finance Charges',   deductible: true  },
  { label: 'Property Management Fees',     deductible: true  },
  { label: 'Repairs & Maintenance',        deductible: true  },
  { label: 'Insurance',                    deductible: true  },
  { label: 'Council Rates',                deductible: true  },
  { label: 'Water Rates',                  deductible: true  },
  { label: 'Strata / Body Corporate Fees', deductible: true  },
  { label: 'Depreciation',                 deductible: true  },
  { label: 'Advertising for Tenants',      deductible: true  },
  { label: 'Legal Expenses',               deductible: true  },
  { label: 'Land Tax',                     deductible: true  },
  { label: 'Pest Control',                 deductible: true  },
  { label: 'Cleaning & Gardening',         deductible: true  },
  { label: 'Capital Improvements',         deductible: false },
  { label: 'Other',                        deductible: true  },
]

// ── FY helpers ────────────────────────────────────────────────────────────────
function recordFY(dateStr: string): string {
  const d = new Date(dateStr)
  const fyEnd = d.getMonth() >= 6 ? d.getFullYear() + 1 : d.getFullYear()
  return `FY${fyEnd}`
}
function currentFY(): string { return recordFY(new Date().toISOString()) }
function fyLabel(fy: string): string {
  const yr = parseInt(fy.replace('FY', ''))
  return `${fy}  (Jul ${yr - 1} – Jun ${yr})`
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const CARD = {
  background: 'rgba(13,16,40,0.8)',
  border: '1px solid rgba(99,102,241,0.15)',
  backdropFilter: 'blur(12px)',
} as const

const MODAL = {
  background: 'rgba(10,12,30,0.95)',
  border: '1px solid rgba(99,102,241,0.25)',
  boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
} as const

const LC = { color: 'rgba(161,174,255,0.5)' } as const    // label colour
const TC = { color: 'rgba(220,225,255,0.9)' } as const    // text colour

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  properties: RealEstate[]
  expenses: RealEstateExpense[]
  income: RealEstateIncome[]
  userId: string
}

export function RealEstateClient({ properties, expenses: initExp, income: initInc, userId }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  // tab + filters
  const [tab, setTab] = useState<'properties' | 'income' | 'expenses' | 'summary'>('properties')
  const [selectedFY, setSelectedFY] = useState(currentFY())
  const [filterPropId, setFilterPropId] = useState('')

  // local data (optimistic)
  const [expenses, setExpenses] = useState(initExp)
  const [income, setIncome]     = useState(initInc)

  // modal visibility
  const [showProp, setShowProp] = useState(false)
  const [showExp,  setShowExp]  = useState(false)
  const [showInc,  setShowInc]  = useState(false)

  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  // ── Property form ───────────────────────────────────────────────────────────
  const PROP_INIT = {
    name: '', address: '', property_type: 'residential' as RealEstate['property_type'],
    country: 'AU', currency: 'AUD', purchase_price: '', purchase_date: '',
    current_valuation: '', valuation_date: new Date().toISOString().split('T')[0],
    loan_outstanding: '', loan_rate: '', rental_income_monthly: '', expenses_monthly: '',
  }
  const [propF, setPropF] = useState(PROP_INIT)
  const upProp = (k: string, v: string) => setPropF(f => ({ ...f, [k]: v }))

  // ── Expense form ────────────────────────────────────────────────────────────
  const EXP_INIT = {
    property_id:   properties[0]?.id ?? '',
    date:          new Date().toISOString().split('T')[0],
    amount:        '',
    category:      ATO_CATEGORIES[0].label,
    description:   '',
    is_deductible: true,
    file:          null as File | null,
  }
  const [expF, setExpF] = useState(EXP_INIT)
  const upExp = (k: string, v: unknown) => setExpF(f => ({ ...f, [k]: v }))

  // When category changes, auto-set deductibility
  function onCategoryChange(cat: string) {
    const def = ATO_CATEGORIES.find(c => c.label === cat)
    setExpF(f => ({ ...f, category: cat, is_deductible: def?.deductible ?? true }))
  }

  // ── Income form ─────────────────────────────────────────────────────────────
  const INC_INIT = {
    property_id: properties[0]?.id ?? '',
    date:        new Date().toISOString().split('T')[0],
    amount:      '',
    description: 'Rental income',
  }
  const [incF, setIncF] = useState(INC_INIT)
  const upInc = (k: string, v: string) => setIncF(f => ({ ...f, [k]: v }))

  // ── Derived ─────────────────────────────────────────────────────────────────
  const allFYs = Array.from(new Set([
    currentFY(),
    ...expenses.map(e => recordFY(e.date)),
    ...income.map(i => recordFY(i.date)),
  ])).sort().reverse()

  const filteredExp = expenses.filter(e =>
    recordFY(e.date) === selectedFY && (!filterPropId || e.property_id === filterPropId)
  )
  const filteredInc = income.filter(i =>
    recordFY(i.date) === selectedFY && (!filterPropId || i.property_id === filterPropId)
  )

  const totalValue  = properties.reduce((s, p) => s + (p.current_valuation ?? 0), 0)
  const totalEquity = properties.reduce((s, p) => s + ((p.current_valuation ?? 0) - p.loan_outstanding), 0)
  const totalLoan   = properties.reduce((s, p) => s + p.loan_outstanding, 0)

  const fyIncome     = filteredInc.reduce((s, i) => s + i.amount, 0)
  const fyExpenses   = filteredExp.reduce((s, e) => s + e.amount, 0)
  const fyDeductible = filteredExp.filter(e => e.is_deductible).reduce((s, e) => s + e.amount, 0)
  const fyNet        = fyIncome - fyExpenses

  function propName(id: string) { return properties.find(p => p.id === id)?.name ?? 'Unknown' }

  // ── Save handlers ───────────────────────────────────────────────────────────
  async function saveProperty() {
    if (!propF.name) return
    setSaving(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.from('real_estate').insert({
      user_id: userId, name: propF.name, address: propF.address || null,
      property_type: propF.property_type, country: propF.country, currency: propF.currency,
      purchase_price:        propF.purchase_price        ? parseFloat(propF.purchase_price)        : null,
      purchase_date:         propF.purchase_date         || null,
      current_valuation:     propF.current_valuation     ? parseFloat(propF.current_valuation)     : null,
      valuation_date:        propF.valuation_date        || null,
      loan_outstanding:      parseFloat(propF.loan_outstanding) || 0,
      loan_rate:             propF.loan_rate             ? parseFloat(propF.loan_rate)             : null,
      rental_income_monthly: propF.rental_income_monthly ? parseFloat(propF.rental_income_monthly) : null,
      expenses_monthly:      propF.expenses_monthly      ? parseFloat(propF.expenses_monthly)      : null,
    })
    setSaving(false)
    if (error) { setError(error.message); return }
    setShowProp(false); setPropF(PROP_INIT); router.refresh()
  }

  async function saveExpense() {
    if (!expF.amount || !expF.property_id) return
    setSaving(true); setError('')
    const supabase = createClient()

    // Receipt upload (optional — requires 'property-receipts' bucket in Supabase Storage)
    let receiptUrl: string | null = null
    if (expF.file) {
      const ext  = expF.file.name.split('.').pop()
      const path = `${userId}/${expF.property_id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('property-receipts').upload(path, expF.file)
      if (!upErr) {
        const { data } = supabase.storage.from('property-receipts').getPublicUrl(path)
        receiptUrl = data.publicUrl
      }
    }

    const { data, error } = await supabase.from('real_estate_expenses').insert({
      user_id:       userId,
      property_id:   expF.property_id,
      date:          expF.date,
      amount:        parseFloat(expF.amount),
      category:      expF.category,
      description:   expF.description || null,
      is_deductible: expF.is_deductible,
      receipt_url:   receiptUrl,
    }).select().single()

    setSaving(false)
    if (error) { setError(error.message); return }
    if (data) setExpenses(prev => [data as RealEstateExpense, ...prev])
    setShowExp(false); setExpF(EXP_INIT)
  }

  async function saveIncome() {
    if (!incF.amount || !incF.property_id) return
    setSaving(true); setError('')
    const supabase = createClient()
    const { data, error } = await supabase.from('real_estate_income').insert({
      user_id:     userId,
      property_id: incF.property_id,
      date:        incF.date,
      amount:      parseFloat(incF.amount),
      description: incF.description || null,
    }).select().single()

    setSaving(false)
    if (error) { setError(error.message); return }
    if (data) setIncome(prev => [data as RealEstateIncome, ...prev])
    setShowInc(false); setIncF(INC_INIT)
  }

  async function deleteExpense(id: string) {
    const supabase = createClient()
    await supabase.from('real_estate_expenses').delete().eq('id', id)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  async function deleteIncome(id: string) {
    const supabase = createClient()
    await supabase.from('real_estate_income').delete().eq('id', id)
    setIncome(prev => prev.filter(i => i.id !== id))
  }

  // ── CSV export ──────────────────────────────────────────────────────────────
  function exportCSV() {
    const byCategory: Record<string, { amount: number; deductible: boolean }> = {}
    filteredExp.forEach(e => {
      if (!byCategory[e.category]) byCategory[e.category] = { amount: 0, deductible: e.is_deductible }
      byCategory[e.category].amount += e.amount
    })

    const rows = [
      ['WealthLens – Real Estate FY Summary', fyLabel(selectedFY)],
      [],
      ['RENTAL INCOME'],
      ...filteredInc.map(i => [i.date, propName(i.property_id), i.description ?? '', i.amount.toFixed(2)]),
      ['', '', 'TOTAL', fyIncome.toFixed(2)],
      [],
      ['EXPENSES', '', 'Category', 'Amount', 'ATO Deductible?'],
      ...filteredExp.map(e => [e.date, propName(e.property_id), e.category, e.amount.toFixed(2), e.is_deductible ? 'Yes' : 'No']),
      [],
      ['EXPENSE SUMMARY BY CATEGORY'],
      ['Category', 'Total', 'Deductible?'],
      ...Object.entries(byCategory).map(([cat, { amount, deductible }]) =>
        [cat, amount.toFixed(2), deductible ? 'Yes' : 'No']
      ),
      [],
      ['NET POSITION'],
      ['Total Rental Income',      '', '', fyIncome.toFixed(2)],
      ['Total Expenses',           '', '', fyExpenses.toFixed(2)],
      ['Total Deductible Expenses','', '', fyDeductible.toFixed(2)],
      ['Net Rental Income / (Loss)','','', fyNet.toFixed(2)],
    ]

    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `real-estate-${selectedFY}.csv`
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  // ── Filter bar ──────────────────────────────────────────────────────────────
  const FilterBar = () => (
    <div className="flex items-center gap-2 flex-wrap">
      <select value={selectedFY} onChange={e => setSelectedFY(e.target.value)}
        className="h-8 px-3 rounded-lg text-xs input-dark">
        {allFYs.map(fy => <option key={fy} value={fy}>{fyLabel(fy)}</option>)}
      </select>
      {properties.length > 1 && (
        <select value={filterPropId} onChange={e => setFilterPropId(e.target.value)}
          className="h-8 px-3 rounded-lg text-xs input-dark">
          <option value="">All properties</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      )}
    </div>
  )

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Top stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Portfolio Value', value: formatAUD(totalValue),  grad: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', sh: 'rgba(139,92,246,0.3)', icon: <Home className="h-4 w-4 text-white" /> },
          { label: 'Total Equity',    value: formatAUD(totalEquity), grad: 'linear-gradient(135deg,#10b981,#059669)', sh: 'rgba(16,185,129,0.3)',  icon: <TrendingUp className="h-4 w-4 text-white" /> },
          { label: 'Total Loan',      value: formatAUD(totalLoan),   grad: 'linear-gradient(135deg,#ef4444,#dc2626)', sh: 'rgba(239,68,68,0.3)',   icon: <DollarSign className="h-4 w-4 text-white" /> },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-5 flex flex-col gap-3" style={CARD}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={LC}>{s.label}</span>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ background: s.grad, boxShadow: `0 4px 12px ${s.sh}` }}>{s.icon}</div>
            </div>
            <p className="text-2xl font-bold tracking-tight" style={TC}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tab nav ── */}
      <div className="flex gap-1 rounded-xl p-1" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', width: 'fit-content' }}>
        {([
          { id: 'properties', label: 'Properties',  icon: <Home className="h-3.5 w-3.5" /> },
          { id: 'income',     label: 'Income',       icon: <TrendingUp className="h-3.5 w-3.5" /> },
          { id: 'expenses',   label: 'Expenses',     icon: <Receipt className="h-3.5 w-3.5" /> },
          { id: 'summary',    label: 'FY Summary',   icon: <BarChart3 className="h-3.5 w-3.5" /> },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            style={tab === t.id
              ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', boxShadow: '0 2px 12px rgba(99,102,241,0.4)' }
              : { color: 'rgba(161,174,255,0.6)' }
            }
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: Properties
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'properties' && (
        <div className="rounded-2xl overflow-hidden" style={CARD}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
            <div>
              <h3 className="font-semibold" style={TC}>Properties</h3>
              {properties.length > 0 && <p className="text-xs mt-0.5" style={LC}>{properties.length} propert{properties.length !== 1 ? 'ies' : 'y'}</p>}
            </div>
            <button onClick={() => setShowProp(true)} className="btn-gradient flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white">
              <Plus className="h-3 w-3" /> Add Property
            </button>
          </div>

          {properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', boxShadow: '0 8px 24px rgba(139,92,246,0.3)' }}>
                <Home className="h-8 w-8 text-white" />
              </div>
              <p className="font-semibold mb-1" style={TC}>No properties yet</p>
              <p className="text-sm mb-4" style={LC}>Track investment properties in Australia and India</p>
              <button onClick={() => setShowProp(true)} className="btn-gradient px-4 py-2 rounded-lg text-sm text-white">
                Add your first property →
              </button>
            </div>
          ) : (
            <div>
              {properties.map(p => {
                const equity = (p.current_valuation ?? 0) - p.loan_outstanding
                const monthlyCF = (p.rental_income_monthly ?? 0) - (p.expenses_monthly ?? 0)
                const gain    = p.purchase_price ? (p.current_valuation ?? 0) - p.purchase_price : null
                const gainPct = p.purchase_price && gain !== null ? (gain / p.purchase_price) * 100 : null

                return (
                  <div key={p.id} className="p-6 transition-colors" style={{ borderBottom: '1px solid rgba(99,102,241,0.08)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.03)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}>
                        <Home className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-lg" style={TC}>{p.name}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                            {p.country === 'AU' ? '🇦🇺' : p.country === 'IN' ? '🇮🇳' : '🌐'} {p.country}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize"
                            style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
                            {p.property_type}
                          </span>
                        </div>
                        {p.address && <p className="text-sm mt-0.5" style={LC}>{p.address}</p>}
                      </div>
                      {gain !== null && gainPct !== null && (
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 justify-end">
                            {gain >= 0 ? <TrendingUp className="h-3 w-3 text-emerald-400" /> : <TrendingDown className="h-3 w-3 text-red-400" />}
                            <span className={`text-sm font-bold ${gain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{gainPct.toFixed(1)}%</span>
                          </div>
                          <p className="text-[10px]" style={LC}>Since purchase</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-xl p-3" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)' }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={LC}>Current Value</p>
                        <p className="font-bold text-sm" style={TC}>{formatAUD(p.current_valuation)}</p>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.12)' }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1 text-emerald-500">Equity</p>
                        <p className="font-bold text-sm text-emerald-400">{formatAUD(equity)}</p>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.12)' }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1 text-red-400">
                          Loan{p.loan_rate ? ` @ ${p.loan_rate}%` : ''}
                        </p>
                        <p className="font-bold text-sm text-red-400">{formatAUD(p.loan_outstanding)}</p>
                      </div>
                      {p.rental_income_monthly != null && (
                        <div className="rounded-xl p-3"
                          style={{
                            background: monthlyCF >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                            border: `1px solid ${monthlyCF >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'}`,
                          }}>
                          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={LC}>Monthly CF</p>
                          <p className={`font-bold text-sm ${monthlyCF >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatAUD(monthlyCF)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: Income
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'income' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <FilterBar />
            <button onClick={() => { setError(''); setShowInc(true) }}
              className="btn-gradient flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white"
              disabled={properties.length === 0}>
              <Plus className="h-3 w-3" /> Add Income
            </button>
          </div>

          {/* FY income total */}
          <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-500">Total Rental Income {selectedFY}</p>
              <p className="text-2xl font-black text-emerald-400">{formatAUD(fyIncome)}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[11px]" style={LC}>{filteredInc.length} entries</p>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden" style={CARD}>
            {filteredInc.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <TrendingUp className="h-10 w-10 mb-3" style={{ color: 'rgba(99,102,241,0.3)' }} />
                <p className="text-sm" style={LC}>No income recorded for {fyLabel(selectedFY)}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.12)', background: 'rgba(99,102,241,0.04)' }}>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest" style={LC}>Date</th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest" style={LC}>Property</th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest" style={LC}>Description</th>
                    <th className="text-right px-5 py-3 text-[10px] font-semibold uppercase tracking-widest" style={LC}>Amount</th>
                    <th className="px-3 py-3 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInc.map(i => (
                    <tr key={i.id} style={{ borderBottom: '1px solid rgba(99,102,241,0.07)' }}
                      className="group transition-colors"
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.04)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
                      <td className="px-5 py-3 text-xs" style={LC}>{i.date}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                          {propName(i.property_id)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs" style={TC}>{i.description ?? '—'}</td>
                      <td className="px-5 py-3 text-right font-bold text-emerald-400 tabular-nums">+{formatAUD(i.amount)}</td>
                      <td className="px-3 py-3">
                        <button onClick={() => deleteIncome(i.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                          style={{ color: 'rgba(239,68,68,0.6)' }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: Expenses
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <FilterBar />
            <button onClick={() => { setError(''); setShowExp(true) }}
              className="btn-gradient flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white"
              disabled={properties.length === 0}>
              <Plus className="h-3 w-3" /> Log Expense
            </button>
          </div>

          {/* FY expense totals */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: `Total Expenses ${selectedFY}`,     value: formatAUD(fyExpenses),   grad: 'linear-gradient(135deg,#ef4444,#dc2626)', shade: 'rgba(239,68,68,0.08)',    border: 'rgba(239,68,68,0.2)',    tc: 'text-red-400' },
              { label: 'ATO Deductible',                   value: formatAUD(fyDeductible), grad: 'linear-gradient(135deg,#10b981,#059669)', shade: 'rgba(16,185,129,0.08)',   border: 'rgba(16,185,129,0.2)',   tc: 'text-emerald-400' },
              { label: 'Non-Deductible',                   value: formatAUD(fyExpenses - fyDeductible), grad: 'linear-gradient(135deg,#f59e0b,#d97706)', shade: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', tc: 'text-amber-400' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-4 flex items-center gap-3"
                style={{ background: s.shade, border: `1px solid ${s.border}` }}>
                <p className="flex-1 text-[11px] font-semibold uppercase tracking-wider" style={LC}>{s.label}</p>
                <p className={`text-lg font-black tabular-nums ${s.tc}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl overflow-hidden" style={CARD}>
            {filteredExp.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Receipt className="h-10 w-10 mb-3" style={{ color: 'rgba(99,102,241,0.3)' }} />
                <p className="text-sm" style={LC}>No expenses logged for {fyLabel(selectedFY)}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.12)', background: 'rgba(99,102,241,0.04)' }}>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest" style={LC}>Date</th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest" style={LC}>Property</th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest" style={LC}>Category</th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest" style={LC}>Description</th>
                    <th className="text-center px-3 py-3 text-[10px] font-semibold uppercase tracking-widest" style={LC}>Deductible</th>
                    <th className="text-right px-5 py-3 text-[10px] font-semibold uppercase tracking-widest" style={LC}>Amount</th>
                    <th className="px-3 py-3 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExp.map(e => (
                    <tr key={e.id} style={{ borderBottom: '1px solid rgba(99,102,241,0.07)' }}
                      className="group transition-colors"
                      onMouseEnter={el => { (el.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.04)' }}
                      onMouseLeave={el => { (el.currentTarget as HTMLElement).style.background = '' }}>
                      <td className="px-5 py-3 text-xs whitespace-nowrap" style={LC}>{e.date}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                          {propName(e.property_id)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs font-medium" style={TC}>{e.category}</td>
                      <td className="px-5 py-3 text-xs max-w-[180px] truncate" style={LC}>
                        <span title={e.description ?? ''}>{e.description ?? '—'}</span>
                        {e.receipt_url && (
                          <a href={e.receipt_url} target="_blank" rel="noreferrer"
                            className="ml-1.5 inline-flex" title="View receipt">
                            <ExternalLink className="h-3 w-3" style={{ color: '#818cf8' }} />
                          </a>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {e.is_deductible
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" />
                          : <XCircle      className="h-4 w-4 text-red-400 mx-auto" />
                        }
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-red-400 tabular-nums">{formatAUD(e.amount)}</td>
                      <td className="px-3 py-3">
                        <button onClick={() => deleteExpense(e.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                          style={{ color: 'rgba(239,68,68,0.6)' }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: FY Summary
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'summary' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <FilterBar />
            <button onClick={exportCSV}
              className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={TC}>
              <FileDown className="h-3.5 w-3.5" /> Export CSV
            </button>
          </div>

          {/* Net position hero */}
          <div className="rounded-2xl p-6 relative overflow-hidden"
            style={{ background: fyNet >= 0 ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}>
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <p className="text-xs font-bold text-white/60 uppercase tracking-[0.15em] mb-1">Net Rental {fyNet >= 0 ? 'Profit' : 'Loss'} — {fyLabel(selectedFY)}</p>
            <p className="text-4xl font-black text-white">{formatAUD(Math.abs(fyNet))}</p>
            <p className="text-sm text-white/70 mt-2">{formatAUD(fyIncome)} income  −  {formatAUD(fyExpenses)} expenses</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Income breakdown */}
            <div className="rounded-2xl overflow-hidden" style={CARD}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
                <h3 className="font-semibold text-sm" style={TC}>Rental Income</h3>
              </div>
              {filteredInc.length === 0 ? (
                <p className="px-5 py-8 text-sm text-center" style={LC}>No income in this period</p>
              ) : (
                <div className="p-5 space-y-3">
                  {properties
                    .filter(p => !filterPropId || p.id === filterPropId)
                    .map(p => {
                      const amt = filteredInc.filter(i => i.property_id === p.id).reduce((s, i) => s + i.amount, 0)
                      if (amt === 0) return null
                      const pct = fyIncome > 0 ? (amt / fyIncome) * 100 : 0
                      return (
                        <div key={p.id}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span style={TC}>{p.name}</span>
                            <span className="font-bold text-emerald-400">{formatAUD(amt)}</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(16,185,129,0.12)' }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#10b981,#059669)' }} />
                          </div>
                        </div>
                      )
                    })}
                  <div className="flex justify-between text-sm font-bold pt-2 mt-2" style={{ borderTop: '1px solid rgba(99,102,241,0.12)', color: '#6ee7b7' }}>
                    <span>Total</span><span>{formatAUD(fyIncome)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Expense breakdown by ATO category */}
            <div className="rounded-2xl overflow-hidden" style={CARD}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
                <h3 className="font-semibold text-sm" style={TC}>ATO Expense Categories</h3>
              </div>
              {filteredExp.length === 0 ? (
                <p className="px-5 py-8 text-sm text-center" style={LC}>No expenses in this period</p>
              ) : (
                <div className="p-5 space-y-2.5">
                  {ATO_CATEGORIES
                    .map(cat => ({
                      ...cat,
                      amt: filteredExp.filter(e => e.category === cat.label).reduce((s, e) => s + e.amount, 0),
                    }))
                    .filter(cat => cat.amt > 0)
                    .sort((a, b) => b.amt - a.amt)
                    .map(cat => {
                      const pct = fyExpenses > 0 ? (cat.amt / fyExpenses) * 100 : 0
                      return (
                        <div key={cat.label}>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <div className="flex items-center gap-1.5">
                              {cat.deductible
                                ? <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                                : <XCircle      className="h-3 w-3 text-amber-400 shrink-0" />
                              }
                              <span style={TC}>{cat.label}</span>
                            </div>
                            <span className="font-bold text-red-400">{formatAUD(cat.amt)}</span>
                          </div>
                          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(239,68,68,0.1)' }}>
                            <div className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: cat.deductible ? 'linear-gradient(90deg,#6366f1,#8b5cf6)' : 'linear-gradient(90deg,#f59e0b,#d97706)' }} />
                          </div>
                        </div>
                      )
                    })}
                  <div className="pt-3 mt-1 space-y-1" style={{ borderTop: '1px solid rgba(99,102,241,0.12)' }}>
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-emerald-400"><CheckCircle2 className="h-3 w-3" />Deductible total</span>
                      <span className="font-bold text-emerald-400">{formatAUD(fyDeductible)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-amber-400"><XCircle className="h-3 w-3" />Non-deductible</span>
                      <span className="font-bold text-amber-400">{formatAUD(fyExpenses - fyDeductible)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold pt-1" style={{ color: '#fca5a5' }}>
                      <span>Total expenses</span><span>{formatAUD(fyExpenses)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Accountant note */}
          <div className="rounded-xl px-4 py-3 text-xs flex items-start gap-2"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: 'rgba(251,191,36,0.8)' }}>
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>This summary is for reference only and does not constitute tax advice. Deductibility flags follow general ATO guidelines — confirm with your registered tax agent before lodging. Capital improvements and mixed-use expenses may require apportionment.</span>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Add Property
      ══════════════════════════════════════════════════════════════════════ */}
      {showProp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-lg rounded-2xl max-h-[90vh] flex flex-col" style={MODAL}>
            <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
              <div>
                <h2 className="font-bold text-lg" style={TC}>Add Property</h2>
                <p className="text-xs mt-0.5" style={LC}>Add an investment property to your portfolio</p>
              </div>
              <button onClick={() => setShowProp(false)} className="h-8 w-8 rounded-lg flex items-center justify-center" style={LC}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Property Name *</label>
                <input value={propF.name} onChange={e => upProp('name', e.target.value)} placeholder="Investment property Sydney"
                  className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Address</label>
                <input value={propF.address} onChange={e => upProp('address', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Type</label>
                  <select value={propF.property_type} onChange={e => upProp('property_type', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark">
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="land">Land</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Country</label>
                  <select value={propF.country} onChange={e => { upProp('country', e.target.value); upProp('currency', e.target.value === 'IN' ? 'INR' : 'AUD') }}
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark">
                    <option value="AU">🇦🇺 AU</option>
                    <option value="IN">🇮🇳 IN</option>
                    <option value="US">🇺🇸 US</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Currency</label>
                  <input value={propF.currency} readOnly className="w-full h-10 px-3 rounded-lg text-sm input-dark opacity-60" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Current Valuation</label>
                  <input type="number" value={propF.current_valuation} onChange={e => upProp('current_valuation', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Loan Outstanding</label>
                  <input type="number" value={propF.loan_outstanding} onChange={e => upProp('loan_outstanding', e.target.value)} placeholder="0"
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Loan Rate (%)</label>
                  <input type="number" step="0.01" value={propF.loan_rate} onChange={e => upProp('loan_rate', e.target.value)} placeholder="6.5"
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Purchase Price</label>
                  <input type="number" value={propF.purchase_price} onChange={e => upProp('purchase_price', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Rental Income / mo</label>
                  <input type="number" value={propF.rental_income_monthly} onChange={e => upProp('rental_income_monthly', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Expenses / mo</label>
                  <input type="number" value={propF.expenses_monthly} onChange={e => upProp('expenses_monthly', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
              </div>
              {error && <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>{error}</div>}
            </div>
            <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: '1px solid rgba(99,102,241,0.2)' }}>
              <button onClick={() => setShowProp(false)} className="btn-ghost px-4 py-2 text-sm rounded-lg">Cancel</button>
              <button onClick={saveProperty} disabled={saving || !propF.name}
                className="btn-gradient px-5 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Property
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Log Expense
      ══════════════════════════════════════════════════════════════════════ */}
      {showExp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl max-h-[90vh] flex flex-col" style={MODAL}>
            <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
              <div>
                <h2 className="font-bold text-lg" style={TC}>Log Expense</h2>
                <p className="text-xs mt-0.5" style={LC}>Record an ATO-categorised property expense</p>
              </div>
              <button onClick={() => setShowExp(false)} className="h-8 w-8 rounded-lg flex items-center justify-center" style={LC}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Property</label>
                  <select value={expF.property_id} onChange={e => upExp('property_id', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark">
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Date</label>
                  <input type="date" value={expF.date} onChange={e => upExp('date', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>ATO Category</label>
                <select value={expF.category} onChange={e => onCategoryChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg text-sm input-dark">
                  {ATO_CATEGORIES.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
                </select>
              </div>
              {/* Deductibility indicator */}
              <div className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{
                  background: expF.is_deductible ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                  border: `1px solid ${expF.is_deductible ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                }}>
                {expF.is_deductible
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  : <XCircle      className="h-4 w-4 text-amber-400 shrink-0" />
                }
                <span className="text-xs" style={{ color: expF.is_deductible ? '#6ee7b7' : '#fcd34d' }}>
                  {expF.is_deductible ? 'ATO deductible — will appear in your tax summary' : 'Not immediately deductible (capital improvement)'}
                </span>
                <button onClick={() => upExp('is_deductible', !expF.is_deductible)}
                  className="ml-auto text-[10px] underline" style={LC}>Override</button>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Amount (AUD)</label>
                <input type="number" step="0.01" value={expF.amount} onChange={e => upExp('amount', e.target.value)} placeholder="0.00"
                  className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Description</label>
                <input value={expF.description} onChange={e => upExp('description', e.target.value)} placeholder="e.g. Monthly mortgage interest — ANZ"
                  className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
              </div>
              {/* Receipt upload */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Receipt (PDF / Image)</label>
                <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
                  onChange={e => upExp('file', e.target.files?.[0] ?? null)} />
                <button onClick={() => fileRef.current?.click()}
                  className="w-full h-10 rounded-lg text-xs flex items-center justify-center gap-2 transition-all"
                  style={{
                    border: '1px dashed rgba(99,102,241,0.3)',
                    background: expF.file ? 'rgba(16,185,129,0.08)' : 'rgba(99,102,241,0.05)',
                    color: expF.file ? '#6ee7b7' : 'rgba(161,174,255,0.5)',
                  }}>
                  {expF.file ? <><CheckCircle2 className="h-4 w-4" />{expF.file.name}</> : <><Upload className="h-4 w-4" />Upload receipt</>}
                </button>
              </div>
              {error && <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>{error}</div>}
            </div>
            <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: '1px solid rgba(99,102,241,0.2)' }}>
              <button onClick={() => setShowExp(false)} className="btn-ghost px-4 py-2 text-sm rounded-lg">Cancel</button>
              <button onClick={saveExpense} disabled={saving || !expF.amount || !expF.property_id}
                className="btn-gradient px-5 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Log Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Add Income
      ══════════════════════════════════════════════════════════════════════ */}
      {showInc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-2xl flex flex-col" style={MODAL}>
            <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
              <div>
                <h2 className="font-bold text-lg" style={TC}>Record Income</h2>
                <p className="text-xs mt-0.5" style={LC}>Log rental income for a property</p>
              </div>
              <button onClick={() => setShowInc(false)} className="h-8 w-8 rounded-lg flex items-center justify-center" style={LC}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Property</label>
                <select value={incF.property_id} onChange={e => upInc('property_id', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg text-sm input-dark">
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Date</label>
                  <input type="date" value={incF.date} onChange={e => upInc('date', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Amount (AUD)</label>
                  <input type="number" step="0.01" value={incF.amount} onChange={e => upInc('amount', e.target.value)} placeholder="0.00"
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Description</label>
                <input value={incF.description} onChange={e => upInc('description', e.target.value)} placeholder="Rental income"
                  className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
              </div>
              {error && <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>{error}</div>}
            </div>
            <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: '1px solid rgba(99,102,241,0.2)' }}>
              <button onClick={() => setShowInc(false)} className="btn-ghost px-4 py-2 text-sm rounded-lg">Cancel</button>
              <button onClick={saveIncome} disabled={saving || !incF.amount || !incF.property_id}
                className="btn-gradient px-5 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
