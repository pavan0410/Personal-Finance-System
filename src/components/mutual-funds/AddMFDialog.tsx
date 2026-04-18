'use client'

import { useState, useEffect } from 'react'
import { X, Search, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface MFAPIResult {
  schemeCode: number
  schemeName: string
}

interface Props {
  onClose: () => void
}

export function AddMFDialog({ onClose }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MFAPIResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<MFAPIResult | null>(null)
  const [units, setUnits] = useState('')
  const [avgNav, setAvgNav] = useState('')
  const [category, setCategory] = useState('')
  const [sipActive, setSipActive] = useState(false)
  const [sipAmount, setSipAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (query.length < 3) { setResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.slice(0, 10))
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [query])

  async function fetchCurrentNAV(schemeCode: number): Promise<{ nav: number; date: string } | null> {
    try {
      const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`)
      const data = await res.json()
      const latest = data.data?.[0]
      return latest ? { nav: parseFloat(latest.nav), date: latest.date } : null
    } catch {
      return null
    }
  }

  async function handleSave() {
    if (!selected || !units) return
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const navData = await fetchCurrentNAV(selected.schemeCode)
    const unitsNum = parseFloat(units)
    const avgNavNum = parseFloat(avgNav) || 0
    const costINR = unitsNum * avgNavNum
    const currentValueINR = navData ? unitsNum * navData.nav : costINR

    const { error } = await supabase.from('mutual_fund_holdings').insert({
      user_id: user!.id,
      scheme_code: selected.schemeCode.toString(),
      scheme_name: selected.schemeName,
      category: category || null,
      units: unitsNum,
      avg_purchase_nav: avgNavNum || null,
      current_nav: navData?.nav ?? null,
      nav_date: navData?.date ?? null,
      cost_basis_inr: costINR,
      current_value_inr: currentValueINR,
      sip_active: sipActive,
      sip_amount: sipActive && sipAmount ? parseFloat(sipAmount) : null,
    })

    if (error) {
      setError(error.message)
      setSaving(false)
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-semibold">Add Mutual Fund Holding</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {!selected ? (
            <>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Search Fund</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. Mirae Asset, HDFC Flexi..."
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
              </div>
              {results.length > 0 && (
                <ul className="border border-border rounded-lg overflow-hidden">
                  {results.map((r) => (
                    <li key={r.schemeCode}>
                      <button
                        onClick={() => setSelected(r)}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-muted transition-colors border-b border-border last:border-0"
                      >
                        <p className="font-medium leading-tight">{r.schemeName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Code: {r.schemeCode}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {query.length >= 3 && !searching && results.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No funds found</p>
              )}
            </>
          ) : (
            <>
              <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-primary">{selected.schemeName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Code: {selected.schemeCode}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground ml-2">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Units held *</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={units}
                    onChange={(e) => setUnits(e.target.value)}
                    placeholder="1234.5678"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Avg Purchase NAV (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={avgNav}
                    onChange={(e) => setAvgNav(e.target.value)}
                    placeholder="125.50"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select category</option>
                  <option value="Equity">Equity</option>
                  <option value="Debt">Debt</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="ELSS">ELSS</option>
                  <option value="Liquid">Liquid</option>
                  <option value="Index">Index</option>
                  <option value="Gold">Gold</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sipActive}
                    onChange={(e) => setSipActive(e.target.checked)}
                    className="rounded"
                  />
                  <span className="font-medium">Active SIP</span>
                </label>
                {sipActive && (
                  <input
                    type="number"
                    value={sipAmount}
                    onChange={(e) => setSipAmount(e.target.value)}
                    placeholder="Monthly SIP amount (₹)"
                    className="w-full h-10 px-3 mt-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                )}
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
            </>
          )}
        </div>

        {selected && (
          <div className="p-6 border-t border-border flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !units}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Holding
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
