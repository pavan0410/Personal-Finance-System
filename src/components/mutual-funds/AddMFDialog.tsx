'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Search, Loader2, CheckCircle2, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface MFAPIResult { schemeCode: number; schemeName: string }
interface Props { onClose: () => void }

const CATEGORIES = ['Equity', 'Debt', 'Hybrid', 'ELSS', 'Index', 'Liquid', 'Gold', 'International']

const inputCls = `w-full h-11 px-3.5 rounded-xl text-sm transition-all outline-none`
const inputStyle = {
  background: 'hsl(var(--muted))',
  border: '1.5px solid hsl(var(--border))',
  color: 'hsl(var(--foreground))',
}

export function AddMFDialog({ onClose }: Props) {
  const [step, setStep] = useState<'search' | 'details'>('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MFAPIResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<MFAPIResult | null>(null)
  const [units, setUnits] = useState('')
  const [avgNav, setAvgNav] = useState('')
  const [currentNav, setCurrentNav] = useState<{ nav: number; date: string } | null>(null)
  const [fetchingNav, setFetchingNav] = useState(false)
  const [category, setCategory] = useState('')
  const [sipActive, setSipActive] = useState(false)
  const [sipAmount, setSipAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => { searchRef.current?.focus() }, [])

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.slice(0, 8))
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, 350)
    return () => clearTimeout(timer)
  }, [query])

  async function selectFund(r: MFAPIResult) {
    setSelected(r)
    setStep('details')
    setCurrentNav(null)
    setFetchingNav(true)
    try {
      const navData = await fetchCurrentNAV(r.schemeCode)
      setCurrentNav(navData)
    } finally {
      setFetchingNav(false)
    }
  }

  async function fetchCurrentNAV(schemeCode: number) {
    try {
      const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`)
      const data = await res.json()
      const latest = data.data?.[0]
      return latest ? { nav: parseFloat(latest.nav), date: latest.date } : null
    } catch { return null }
  }

  async function handleSave() {
    if (!selected || !units) return
    setSaving(true); setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const navData = currentNav ?? await fetchCurrentNAV(selected.schemeCode)
    const unitsNum = parseFloat(units)
    const avgNavNum = parseFloat(avgNav) || 0
    const { error } = await supabase.from('mutual_fund_holdings').insert({
      user_id: user!.id,
      scheme_code: selected.schemeCode.toString(),
      scheme_name: selected.schemeName,
      category: category || null,
      units: unitsNum,
      avg_purchase_nav: avgNavNum || null,
      current_nav: navData?.nav ?? null,
      nav_date: navData?.date ?? null,
      cost_basis_inr: unitsNum * avgNavNum,
      current_value_inr: navData ? unitsNum * navData.nav : unitsNum * avgNavNum,
      sip_active: sipActive,
      sip_amount: sipActive && sipAmount ? parseFloat(sipAmount) : null,
    })
    if (error) { setError(error.message); setSaving(false) }
    else onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'hsl(0 0% 0% / 0.6)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          boxShadow: '0 25px 80px hsl(0 0% 0% / 0.4)',
        }}>

        {/* Header */}
        <div className="px-6 pt-6 pb-5 flex items-start justify-between"
          style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div>
            <h2 className="font-bold text-lg">Add Mutual Fund</h2>
            <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {step === 'search' ? 'Search from 10,000+ Indian schemes' : selected?.schemeName}
            </p>
          </div>
          <button onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'hsl(var(--muted-foreground))' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="px-6 py-3 flex items-center gap-2"
          style={{ borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--muted) / 0.4)' }}>
          {['Search Fund', 'Add Details'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <ChevronRight className="h-3 w-3" style={{ color: 'hsl(var(--muted-foreground))' }} />}
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={
                    (i === 0 && step === 'search') || (i === 1 && step === 'details')
                      ? { background: 'hsl(var(--primary))', color: 'white' }
                      : i === 0 && step === 'details'
                        ? { background: 'hsl(158 64% 40%)', color: 'white' }
                        : { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }
                  }>
                  {i === 0 && step === 'details' ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                </div>
                <span className="text-xs font-medium" style={{
                  color: (i === 0 && step === 'search') || (i === 1 && step === 'details')
                    ? 'hsl(var(--foreground))'
                    : 'hsl(var(--muted-foreground))'
                }}>{s}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {step === 'search' ? (
            <>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                <input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Search by fund name, AMC, ISIN..."
                  className={inputCls} style={{ ...inputStyle, paddingLeft: '2.5rem', paddingRight: searching ? '2.5rem' : '0.875rem' }}
                  onFocus={e => (e.target as HTMLElement).style.borderColor = 'hsl(var(--primary))'}
                  onBlur={e => (e.target as HTMLElement).style.borderColor = 'hsl(var(--border))'} />
                {searching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" style={{ color: 'hsl(var(--muted-foreground))' }} />}
              </div>

              {results.length > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
                  {results.map((r, i) => (
                    <button key={r.schemeCode} onClick={() => selectFund(r)}
                      className="w-full text-left px-4 py-3.5 text-sm transition-colors flex items-center justify-between group"
                      style={{ borderBottom: i < results.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'hsl(var(--accent))'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="font-medium leading-snug truncate">{r.schemeName}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Code: {r.schemeCode}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'hsl(var(--primary))' }} />
                    </button>
                  ))}
                </div>
              )}

              {query.length >= 2 && !searching && results.length === 0 && (
                <div className="py-8 text-center rounded-xl" style={{ border: '1px dashed hsl(var(--border))' }}>
                  <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>No funds found for &ldquo;{query}&rdquo;</p>
                </div>
              )}

              {query.length < 2 && (
                <div className="py-6 text-center">
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Powered by MFAPI · Real-time NAV data
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Selected fund chip */}
              <div className="flex items-center justify-between p-3.5 rounded-xl"
                style={{ background: 'hsl(var(--accent))', border: '1px solid hsl(var(--accent-foreground) / 0.15)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'hsl(var(--accent-foreground))' }}>{selected?.schemeName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {fetchingNav ? (
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <Loader2 className="h-3 w-3 animate-spin" /> Fetching NAV...
                      </span>
                    ) : currentNav ? (
                      <span className="text-xs font-semibold" style={{ color: 'hsl(158 64% 40%)' }}>
                        Current NAV: ₹{currentNav.nav.toFixed(4)} <span style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 400 }}>as of {currentNav.date}</span>
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>NAV unavailable — will retry on save</span>
                    )}
                  </div>
                </div>
                <button onClick={() => { setSelected(null); setStep('search'); setCurrentNav(null) }}
                  className="ml-2 shrink-0 h-6 w-6 rounded-full flex items-center justify-center"
                  style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                  <X className="h-3 w-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Units Held *
                  </label>
                  <input type="number" step="0.0001" value={units} onChange={e => setUnits(e.target.value)}
                    placeholder="e.g. 1234.5678" className={inputCls} style={inputStyle}
                    onFocus={e => (e.target as HTMLElement).style.borderColor = 'hsl(var(--primary))'}
                    onBlur={e => (e.target as HTMLElement).style.borderColor = 'hsl(var(--border))'} />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Avg NAV (₹)
                  </label>
                  <input type="number" step="0.01" value={avgNav} onChange={e => setAvgNav(e.target.value)}
                    placeholder="e.g. 125.50" className={inputCls} style={inputStyle}
                    onFocus={e => (e.target as HTMLElement).style.borderColor = 'hsl(var(--primary))'}
                    onBlur={e => (e.target as HTMLElement).style.borderColor = 'hsl(var(--border))'} />
                </div>
              </div>

              {units && avgNav && (
                <div className="px-3.5 py-3 rounded-xl text-sm"
                  style={{ background: 'hsl(158 64% 40% / 0.1)', border: '1px solid hsl(158 64% 40% / 0.2)' }}>
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>Invested: </span>
                  <span className="font-semibold" style={{ color: 'hsl(158 64% 40%)' }}>
                    ₹{(parseFloat(units) * parseFloat(avgNav)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setCategory(c === category ? '' : c)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={category === c ? {
                        background: 'hsl(var(--primary))',
                        color: 'white',
                      } : {
                        background: 'hsl(var(--muted))',
                        color: 'hsl(var(--foreground))',
                        border: '1px solid hsl(var(--border))',
                      }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => setSipActive(!sipActive)}
                    className="h-5 w-9 rounded-full relative transition-colors cursor-pointer"
                    style={{ background: sipActive ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}>
                    <div className="h-4 w-4 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm"
                      style={{ transform: sipActive ? 'translateX(16px)' : 'translateX(2px)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Active SIP</p>
                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Systematic Investment Plan running</p>
                  </div>
                </label>
                {sipActive && (
                  <input type="number" value={sipAmount} onChange={e => setSipAmount(e.target.value)}
                    placeholder="Monthly SIP amount (₹)" className={`${inputCls} mt-3`}
                    style={{ ...inputStyle, background: 'hsl(var(--background))' }}
                    onFocus={e => (e.target as HTMLElement).style.borderColor = 'hsl(var(--primary))'}
                    onBlur={e => (e.target as HTMLElement).style.borderColor = 'hsl(var(--border))'} />
                )}
              </div>

              {error && (
                <div className="px-3.5 py-3 rounded-xl text-sm"
                  style={{ background: 'hsl(0 84% 60% / 0.1)', border: '1px solid hsl(0 84% 60% / 0.2)', color: 'hsl(0 84% 60%)' }}>
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {step === 'details' && (
          <div className="px-6 py-4 flex justify-end gap-3"
            style={{ borderTop: '1px solid hsl(var(--border))' }}>
            <button onClick={() => setStep('search')}
              className="px-4 py-2.5 text-sm rounded-xl font-medium transition-colors"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}>
              Back
            </button>
            <button onClick={handleSave} disabled={saving || !units}
              className="px-5 py-2.5 text-sm rounded-xl font-semibold text-white transition-all disabled:opacity-50 flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, hsl(246 83% 60%), hsl(265 83% 60%))' }}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Save Holding
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
