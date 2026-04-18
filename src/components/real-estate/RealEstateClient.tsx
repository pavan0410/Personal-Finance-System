'use client'

import { useState } from 'react'
import { Plus, Home, X, Loader2 } from 'lucide-react'
import { formatAUD, formatINR } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { RealEstate } from '@/types'

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
      user_id: userId,
      name: form.name, address: form.address || null,
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-2">Total Portfolio Value</p>
          <p className="text-3xl font-bold">{formatAUD(totalValue)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-2">Total Equity</p>
          <p className="text-2xl font-bold text-emerald-500">{formatAUD(totalEquity)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-2">Total Loan</p>
          <p className="text-2xl font-bold text-red-500">{formatAUD(totalLoan)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">Properties</h3>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add Property
          </button>
        </div>
        {properties.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Home className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No properties added yet</p>
            <button onClick={() => setShowAdd(true)} className="text-sm text-primary hover:underline">Add your first property →</button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {properties.map((p) => {
              const equity = (p.current_valuation ?? 0) - p.loan_outstanding
              const monthlyCF = (p.rental_income_monthly ?? 0) - (p.expenses_monthly ?? 0)
              return (
                <div key={p.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-lg">{p.name}</p>
                        <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{p.country}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary capitalize">{p.property_type}</span>
                      </div>
                      {p.address && <p className="text-sm text-muted-foreground mt-0.5">{p.address}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div><p className="text-xs text-muted-foreground">Current Value</p><p className="font-bold">{fmt(p.current_valuation, p.currency)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Equity</p><p className="font-bold text-emerald-500">{fmt(equity, p.currency)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Loan Outstanding</p><p className="font-medium text-red-500">{fmt(p.loan_outstanding, p.currency)}{p.loan_rate && <span className="text-xs text-muted-foreground ml-1">@ {p.loan_rate}%</span>}</p></div>
                    {p.rental_income_monthly && (
                      <div><p className="text-xs text-muted-foreground">Monthly Cash Flow</p><p className={`font-medium ${monthlyCF >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{fmt(monthlyCF, p.currency)}/mo</p></div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-semibold">Add Property</h2>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-sm font-medium mb-1.5 block">Property Name *</label>
                <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Home in Bangalore / Sydney apartment"
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Address</label>
                <input value={form.address} onChange={(e) => update('address', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-sm font-medium mb-1.5 block">Type</label>
                  <select value={form.property_type} onChange={(e) => update('property_type', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="land">Land</option>
                  </select></div>
                <div><label className="text-sm font-medium mb-1.5 block">Country</label>
                  <select value={form.country} onChange={(e) => { update('country', e.target.value); update('currency', e.target.value === 'IN' ? 'INR' : 'AUD') }}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="AU">Australia</option>
                    <option value="IN">India</option>
                    <option value="US">USA</option>
                  </select></div>
                <div><label className="text-sm font-medium mb-1.5 block">Currency</label>
                  <input value={form.currency} readOnly className="w-full h-10 px-3 rounded-lg border border-border bg-muted text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium mb-1.5 block">Current Valuation</label>
                  <input type="number" value={form.current_valuation} onChange={(e) => update('current_valuation', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                <div><label className="text-sm font-medium mb-1.5 block">Loan Outstanding</label>
                  <input type="number" value={form.loan_outstanding} onChange={(e) => update('loan_outstanding', e.target.value)} placeholder="0"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium mb-1.5 block">Loan Rate (%)</label>
                  <input type="number" step="0.01" value={form.loan_rate} onChange={(e) => update('loan_rate', e.target.value)} placeholder="6.5"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                <div><label className="text-sm font-medium mb-1.5 block">Purchase Price</label>
                  <input type="number" value={form.purchase_price} onChange={(e) => update('purchase_price', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium mb-1.5 block">Rental Income/mo</label>
                  <input type="number" value={form.rental_income_monthly} onChange={(e) => update('rental_income_monthly', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                <div><label className="text-sm font-medium mb-1.5 block">Expenses/mo</label>
                  <input type="number" value={form.expenses_monthly} onChange={(e) => update('expenses_monthly', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Property
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
