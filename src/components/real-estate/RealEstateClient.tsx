'use client'

import { useState } from 'react'
import { Plus, Home, X, Loader2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { formatAUD, formatINR } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { RealEstate } from '@/types'

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

export function RealEstateClient({ properties, userId }: { properties: RealEstate[]; userId: string }) {
  const router = useRouter()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    name: '', address: '', property_type: 'residential' as RealEstate['property_type'],
    country: 'AU', currency: 'AUD', purchase_price: '', purchase_date: '',
    current_valuation: '', valuation_date: new Date().toISOString().split('T')[0],
    loan_outstanding: '', loan_rate: '', rental_income_monthly: '', expenses_monthly: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const totalEquity = properties.reduce((s, p) => s + ((p.current_valuation ?? 0) - p.loan_outstanding), 0)
  const totalValue = properties.reduce((s, p) => s + (p.current_valuation ?? 0), 0)
  const totalLoan = properties.reduce((s, p) => s + p.loan_outstanding, 0)

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.name) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('real_estate').insert({
      user_id: userId, name: form.name, address: form.address || null,
      property_type: form.property_type, country: form.country, currency: form.currency,
      purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
      purchase_date: form.purchase_date || null,
      current_valuation: form.current_valuation ? parseFloat(form.current_valuation) : null,
      valuation_date: form.valuation_date || null,
      loan_outstanding: parseFloat(form.loan_outstanding) || 0,
      loan_rate: form.loan_rate ? parseFloat(form.loan_rate) : null,
      rental_income_monthly: form.rental_income_monthly ? parseFloat(form.rental_income_monthly) : null,
      expenses_monthly: form.expenses_monthly ? parseFloat(form.expenses_monthly) : null,
    })
    if (error) { setError(error.message); setSaving(false) }
    else { setShowAdd(false); router.refresh() }
  }

  const fmt = (v: number | null | undefined, currency: string) =>
    currency === 'INR' ? formatINR(v) : formatAUD(v)

  const TYPE_LABEL: Record<string, string> = { residential: 'Residential', commercial: 'Commercial', land: 'Land' }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Portfolio Value', value: formatAUD(totalValue), gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', shadow: 'rgba(139,92,246,0.3)', icon: <Home className="h-4 w-4 text-white" /> },
          { label: 'Total Equity', value: formatAUD(totalEquity), gradient: 'linear-gradient(135deg, #10b981, #059669)', shadow: 'rgba(16,185,129,0.3)', icon: <TrendingUp className="h-4 w-4 text-white" /> },
          { label: 'Total Loan', value: formatAUD(totalLoan), gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', shadow: 'rgba(239,68,68,0.3)', icon: <DollarSign className="h-4 w-4 text-white" /> },
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

      {/* Properties */}
      <div className="rounded-2xl overflow-hidden" style={CARD_STYLE}>
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
          <div>
            <h3 className="font-semibold" style={TEXT_COLOR}>Properties</h3>
            {properties.length > 0 && <p className="text-xs mt-0.5" style={LABEL_COLOR}>{properties.length} propert{properties.length !== 1 ? 'ies' : 'y'}</p>}
          </div>
          <button onClick={() => setShowAdd(true)}
            className="btn-gradient flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white">
            <Plus className="h-3 w-3" /> Add Property
          </button>
        </div>

        {properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', boxShadow: '0 8px 24px rgba(139,92,246,0.3)' }}>
              <Home className="h-8 w-8 text-white" />
            </div>
            <p className="font-semibold mb-1" style={TEXT_COLOR}>No properties added</p>
            <p className="text-sm mb-4" style={LABEL_COLOR}>Track your real estate portfolio in India and Australia</p>
            <button onClick={() => setShowAdd(true)} className="btn-gradient px-4 py-2 rounded-lg text-sm text-white">
              Add your first property &rarr;
            </button>
          </div>
        ) : (
          <div>
            {properties.map((p) => {
              const equity = (p.current_valuation ?? 0) - p.loan_outstanding
              const monthlyCF = (p.rental_income_monthly ?? 0) - (p.expenses_monthly ?? 0)
              const gainFromPurchase = p.purchase_price ? (p.current_valuation ?? 0) - p.purchase_price : null
              const gainPct = p.purchase_price && gainFromPurchase !== null ? (gainFromPurchase / p.purchase_price) * 100 : null

              return (
                <div key={p.id} className="p-6 transition-colors"
                  style={{ borderBottom: '1px solid rgba(99,102,241,0.08)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.03)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                      <Home className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-lg" style={TEXT_COLOR}>{p.name}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                          {p.country === 'AU' ? '🇦🇺' : p.country === 'IN' ? '🇮🇳' : '🌐'} {p.country}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize"
                          style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
                          {TYPE_LABEL[p.property_type ?? 'residential']}
                        </span>
                      </div>
                      {p.address && <p className="text-sm mt-0.5" style={LABEL_COLOR}>{p.address}</p>}
                    </div>
                    {gainFromPurchase !== null && gainPct !== null && (
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 justify-end">
                          {gainFromPurchase >= 0 ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                          <span className={`text-sm font-bold ${gainFromPurchase >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {gainPct.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-xs" style={LABEL_COLOR}>Since purchase</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl p-3" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)' }}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={LABEL_COLOR}>Current Value</p>
                      <p className="font-bold" style={TEXT_COLOR}>{fmt(p.current_valuation, p.currency)}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.12)' }}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#10b981' }}>Equity</p>
                      <p className="font-bold text-emerald-500">{fmt(equity, p.currency)}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.12)' }}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#ef4444' }}>
                        Loan {p.loan_rate ? `@ ${p.loan_rate}%` : ''}
                      </p>
                      <p className="font-bold text-red-500">{fmt(p.loan_outstanding, p.currency)}</p>
                    </div>
                    {p.rental_income_monthly && (
                      <div className="rounded-xl p-3"
                        style={{
                          background: monthlyCF >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                          border: `1px solid ${monthlyCF >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'}`,
                        }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={LABEL_COLOR}>Monthly CF</p>
                        <p className={`font-bold ${monthlyCF >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{fmt(monthlyCF, p.currency)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-lg rounded-2xl max-h-[90vh] flex flex-col" style={MODAL_STYLE}>
            <div className="px-6 py-5 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
              <div>
                <h2 className="font-bold text-lg" style={TEXT_COLOR}>Add Property</h2>
                <p className="text-xs mt-0.5" style={LABEL_COLOR}>Add a real estate asset to your portfolio</p>
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
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Property Name *</label>
                <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Home in Bangalore / Sydney apartment"
                  className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Address</label>
                <input value={form.address} onChange={(e) => update('address', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Type</label>
                  <select value={form.property_type} onChange={(e) => update('property_type', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark">
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="land">Land</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Country</label>
                  <select value={form.country} onChange={(e) => { update('country', e.target.value); update('currency', e.target.value === 'IN' ? 'INR' : 'AUD') }}
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark">
                    <option value="AU">🇦🇺 AU</option>
                    <option value="IN">🇮🇳 IN</option>
                    <option value="US">🇺🇸 US</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Currency</label>
                  <input value={form.currency} readOnly className="w-full h-10 px-3 rounded-lg text-sm input-dark opacity-60" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Current Valuation</label>
                  <input type="number" value={form.current_valuation} onChange={(e) => update('current_valuation', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Loan Outstanding</label>
                  <input type="number" value={form.loan_outstanding} onChange={(e) => update('loan_outstanding', e.target.value)} placeholder="0"
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Loan Rate (%)</label>
                  <input type="number" step="0.01" value={form.loan_rate} onChange={(e) => update('loan_rate', e.target.value)} placeholder="6.5"
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Purchase Price</label>
                  <input type="number" value={form.purchase_price} onChange={(e) => update('purchase_price', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Rental Income/mo</label>
                  <input type="number" value={form.rental_income_monthly} onChange={(e) => update('rental_income_monthly', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Expenses/mo</label>
                  <input type="number" value={form.expenses_monthly} onChange={(e) => update('expenses_monthly', e.target.value)}
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
            <div className="px-6 py-4 flex justify-end gap-3"
              style={{ borderTop: '1px solid rgba(99,102,241,0.2)' }}>
              <button onClick={() => setShowAdd(false)} className="btn-ghost px-4 py-2 text-sm rounded-lg">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !form.name}
                className="btn-gradient px-5 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Property
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
