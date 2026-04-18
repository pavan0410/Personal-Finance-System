'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-semibold">Add ETF Position</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Ticker *</label>
              <input
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="VAS, IVV, VGS..."
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Exchange</label>
              <select
                value={exchange}
                onChange={(e) => {
                  setExchange(e.target.value as typeof exchange)
                  setCurrency(e.target.value === 'ASX' ? 'AUD' : 'USD')
                }}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="ASX">ASX (AUD)</option>
                <option value="NYSE">NYSE (USD)</option>
                <option value="NASDAQ">NASDAQ (USD)</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Fund name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vanguard Australian Shares ETF"
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Shares *</label>
              <input
                type="number"
                step="0.0001"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="100"
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Avg Price ({currency})</label>
              <input
                type="number"
                step="0.01"
                value={avgPrice}
                onChange={(e) => setAvgPrice(e.target.value)}
                placeholder="95.50"
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Sector</label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
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

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || !ticker || !shares}
            className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Position
          </button>
        </div>
      </div>
    </div>
  )
}
