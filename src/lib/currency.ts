import { createClient } from '@/lib/supabase/server'

export async function getExchangeRate(from: string, to: string): Promise<number> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('exchange_rates')
    .select('rate, fetched_at')
    .eq('from_currency', from)
    .eq('to_currency', to)
    .single()

  if (data) {
    const age = Date.now() - new Date(data.fetched_at).getTime()
    if (age < 6 * 60 * 60 * 1000) return data.rate
  }

  // Fallback: fetch live rate
  try {
    const res = await fetch(
      `https://api.exchangerate-api.com/v6/latest/${from}`,
      { next: { revalidate: 21600 } }
    )
    const json = await res.json()
    const rate = json.conversion_rates?.[to]
    if (rate) {
      await supabase.from('exchange_rates').upsert({
        from_currency: from,
        to_currency: to,
        rate,
        fetched_at: new Date().toISOString(),
      })
      return rate
    }
  } catch {}

  return data?.rate ?? 0.0092 // fallback INR→AUD approx
}

export async function inrToAud(inrAmount: number): Promise<number> {
  const rate = await getExchangeRate('INR', 'AUD')
  return inrAmount * rate
}

export async function usdToAud(usdAmount: number): Promise<number> {
  const rate = await getExchangeRate('USD', 'AUD')
  return usdAmount * rate
}
