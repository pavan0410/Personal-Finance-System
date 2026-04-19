import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

async function fetchNAV(schemeCode: string): Promise<{ nav: number; date: string } | null> {
  try {
    const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`, { next: { revalidate: 0 } })
    const data = await res.json()
    const latest = data.data?.[0]
    if (!latest) return null
    const [dd, mm, yyyy] = (latest.date as string).split('-')
    return { nav: parseFloat(latest.nav), date: `${yyyy}-${mm}-${dd}` }
  } catch { return null }
}

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
    .not('scheme_code', 'is', null)

  if (!holdings?.length) return NextResponse.json({ updated: 0 })

  let updated = 0
  for (const h of holdings) {
    const navData = await fetchNAV(h.scheme_code)
    if (!navData) continue
    const { error } = await service
      .from('mutual_fund_holdings')
      .update({
        current_nav: navData.nav,
        nav_date: navData.date,
        current_value_inr: h.units * navData.nav,
        updated_at: new Date().toISOString(),
      })
      .eq('id', h.id)
    if (!error) updated++
  }

  return NextResponse.json({ success: true, updated })
}
