'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const MODAL_STYLE = {
  background: 'rgba(10,12,30,0.95)',
  border: '1px solid rgba(99,102,241,0.25)',
  boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
}
const LABEL_COLOR = { color: 'rgba(161,174,255,0.5)' }
const TEXT_COLOR = { color: 'rgba(220,225,255,0.9)' }

export function AddETFDialog({ onClose }: { onClose: () => void }) {
  const [ticker, setTicker] = useState('')
  const [name, setName] = useState('')
  const [exchange, setExchange] = useState<'ASX' | 'NYSE' | 'NASDAQ' | 'OTHER'>('ASX')
  const [shares, setShares] = useState('')
  const [avgPrice, setAvgPrice] = useState('')
  const [currency, setCurrency] = useState('AUD')
  const [sector, setSector] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function fetchPrice(): Promise<number | null> {
    try {
      const apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY
      if (!apiKey || apiKey === 'demo') return null
      const res = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`
      )
      const data = await res.json()
      const price = data['Global Quote']?.['05. price']
      return price ? parseFloat(price) : null
    } catch {
      return null
    }
  }

  async function handleSave() {
    if (!ticker || !shares) return
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const currentPrice = await fetchPrice()
    const sharesNum = parseFloat(shares)
    const avgPriceNum = parseFloat(avgPrice) || 0
    const costBasis = sharesNum * avgPriceNum
    const currentValue = currentPrice ? sharesNum * currentPrice : costBasis

    const { error } = await supabase.from('etf_holdings').insert({
      user_id: user!.id,
      ticker: ticker.toUpperCase(),
      name: name || ticker.toUpperCase(),
      exchange,
      shares: sharesNum,
      avg_purchase_price: avgPriceNum || null,
      current_price: currentPrice,
      price_updated_at: currentPrice ? new Date().toISOString() : null,
      currency,
      cost_basis: costBasis,
      current_value_aud: currentValue,
      sector: sector || null,
    })

    if (error) {
      setError(error.message)
      setSaving(false)
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={MODAL_STYLE}>
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
          <div>
            <h2 className="font-bold text-lg" style={TEXT_COLOR}>Add ETF Position</h2>
            <p className="text-xs mt-0.5" style={LABEL_COLOR}>Track your ASX or US ETF holdings</p>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Ticker *</label>
              <input
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="VAS, IVV, VGS..."
                className="w-full h-10 px-3 rounded-lg text-sm input-dark"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Exchange</label>
              <select
                value={exchange}
                onChange={(e) => {
                  setExchange(e.target.value as typeof exchange)
                  setCurrency(e.target.value === 'ASX' ? 'AUD' : 'USD')
                }}
                className="w-full h-10 px-3 rounded-lg text-sm input-dark"
              >
                <option value="ASX">ASX (AUD)</option>
                <option value="NYSE">NYSE (USD)</option>
                <option value="NASDAQ">NASDAQ (USD)</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Fund Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vanguard Australian Shares ETF"
              className="w-full h-10 px-3 rounded-lg text-sm input-dark"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Shares *</label>
              <input
                type="number"
                step="0.0001"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="100"
                className="w-full h-10 px-3 rounded-lg text-sm input-dark"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Avg Price ({currency})</label>
              <input
                type="number"
                step="0.01"
                value={avgPrice}
                onChange={(e) => setAvgPrice(e.target.value)}
                placeholder="95.50"
                className="w-full h-10 px-3 rounded-lg text-sm input-dark"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LABEL_COLOR}>Sector</label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full h-10 px-3 rounded-lg text-sm input-dark"
            >
              <option value="">Select sector</option>
              <option value="Broad Market">Broad Market</option>
              <option value="Technology">Technology</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Financials">Financials</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Bonds">Bonds</option>
              <option value="International">International</option>
              <option value="Commodities">Commodities</option>
            </select>
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
          <button
            onClick={handleSave}
            disabled={saving || !ticker || !shares}
            className="btn-gradient px-5 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Position
          </button>
        </div>
      </div>
    </div>
  )
}
