import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Parse INDmoney SIP allotment email plain text
function parseEmail(text: string) {
  const fundMatch   = text.match(/in ([A-Za-z][^.]+?) is successful/i)
  const unitsMatch  = text.match(/Units allocated[\s\t]+([\d.]+)/i)
  const navMatch    = text.match(/\bNAV[\s\t]+([\d.]+)/)
  const dateMatch   = text.match(/SIP Date[\s\t]+(\d{2}\/\d{2}\/\d{4})/i)
  const folioMatch  = text.match(/Folio Number[\s\t]+(\d+)/i)
  const orderMatch  = text.match(/Order ID[\s\t]+(\d+)/i)
  const amountMatch = text.match(/SIP Amount received[\s\t]+₹([\d,]+)/i)

  if (!fundMatch || !unitsMatch || !navMatch || !dateMatch) return null

  const [dd, mm, yyyy] = dateMatch[1].split('/')
  return {
    fundName: fundMatch[1].trim(),
    units:    parseFloat(unitsMatch[1]),
    nav:      parseFloat(navMatch[1]),
    date:     `${yyyy}-${mm}-${dd}`,
    folio:    folioMatch?.[1]  ?? null,
    orderId:  orderMatch?.[1]  ?? null,
    amount:   amountMatch ? parseInt(amountMatch[1].replace(/,/g, '')) : null,
  }
}

export async function POST(req: Request) {
  // Authenticate with shared secret
  const secret = req.headers.get('x-sync-secret')
  if (!secret || secret !== process.env.MF_SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.emailBody || !body?.userId) {
    return NextResponse.json({ error: 'Missing emailBody or userId' }, { status: 400 })
  }

  const parsed = parseEmail(body.emailBody)
  if (!parsed) {
    return NextResponse.json({ error: 'Could not parse email — unrecognised format', preview: String(body.emailBody).slice(0, 300) }, { status: 422 })
  }

  // Use service-role client so RLS doesn't block server-side writes
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Try to find existing holding by folio number (most reliable)
  let holding: Record<string, unknown> | null = null

  if (parsed.folio) {
    const { data } = await supabase
      .from('mutual_fund_holdings')
      .select('*')
      .eq('user_id', body.userId)
      .eq('folio_number', parsed.folio)
      .maybeSingle()
    holding = data
  }

  // 2. Fall back: fuzzy match on first 3 words of fund name
  if (!holding) {
    const keywords = parsed.fundName.split(' ').slice(0, 3).join(' ')
    const { data } = await supabase
      .from('mutual_fund_holdings')
      .select('*')
      .eq('user_id', body.userId)
      .ilike('scheme_name', `%${keywords}%`)
      .maybeSingle()
    holding = data
  }

  if (holding) {
    // Update: add units, recalculate weighted-average NAV
    const oldUnits  = Number(holding.units)
    const oldAvgNav = Number(holding.avg_purchase_nav ?? parsed.nav)
    const newUnits  = oldUnits + parsed.units
    const newAvgNav = (oldUnits * oldAvgNav + parsed.units * parsed.nav) / newUnits

    const { error } = await supabase
      .from('mutual_fund_holdings')
      .update({
        units:             newUnits,
        avg_purchase_nav:  newAvgNav,
        current_nav:       parsed.nav,
        nav_date:          parsed.date,
        cost_basis_inr:    newUnits * newAvgNav,
        current_value_inr: newUnits * parsed.nav,
        folio_number:      parsed.folio ?? holding.folio_number,
        sip_active:        true,
        updated_at:        new Date().toISOString(),
      })
      .eq('id', holding.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      success: true,
      action: 'updated',
      fund: parsed.fundName,
      addedUnits: parsed.units,
      totalUnits: newUnits,
      newAvgNav,
    })
  }

  // Create new holding (first SIP for this fund)
  const { error } = await supabase
    .from('mutual_fund_holdings')
    .insert({
      user_id:           body.userId,
      scheme_name:       parsed.fundName,
      units:             parsed.units,
      avg_purchase_nav:  parsed.nav,
      current_nav:       parsed.nav,
      nav_date:          parsed.date,
      cost_basis_inr:    parsed.units * parsed.nav,
      current_value_inr: parsed.units * parsed.nav,
      folio_number:      parsed.folio,
      sip_active:        true,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    action: 'created',
    fund: parsed.fundName,
    units: parsed.units,
  })
}
