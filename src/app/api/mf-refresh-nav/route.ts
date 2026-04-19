import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: holdings } = await service
    .from('mutual_fund_holdings')
    .select('id, scheme_code, units, avg_purchase_nav')
    .eq('user_id', user.id)

  if (!holdings?.length) return NextResponse.json({ updated: 0 })

  let updated = 0
  const results: { name: string; nav: number; date: string }[] = []

  for (const h of holdings) {
    if (!h.scheme_code) continue
    try {
      const res = await fetch(`https://api.mfapi.in/mf/${h.scheme_code}`, { cache: 'no-store' })
      const data = await res.json()
      const latest = data.data?.[0]
      if (!latest) continue

      const [dd, mm, yyyy] = (latest.date as string).split('-')
      const navDate = `${yyyy}-${mm}-${dd}`
      const nav = parseFloat(latest.nav)
      const currentValue = h.units * nav

      await service
        .from('mutual_fund_holdings')
        .update({
          current_nav: nav,
          nav_date: navDate,
          current_value_inr: currentValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', h.id)

      results.push({ name: data.meta?.scheme_name ?? h.scheme_code, nav, date: navDate })
      updated++
    } catch {
      // skip individual failures
    }
  }

  return NextResponse.json({ updated, results })
}
