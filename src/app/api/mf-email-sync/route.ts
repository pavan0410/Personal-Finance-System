import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ─── parsers ────────────────────────────────────────────────────────────────

function field(text: string, label: string): string | null {
  const m = text.match(new RegExp(label + '\\s+([^\\n\\r]+)', 'i'))
  return m ? m[1].trim() : null
}

function parseDate(raw: string | null): string | null {
  if (!raw) return null
  const m = raw.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (!m) return null
  return `${m[3]}-${m[2]}-${m[1]}`
}

function parseMoney(raw: string | null): number | null {
  if (!raw) return null
  return parseInt(raw.replace(/[₹,\s]/g, '')) || null
}

function parseFundName(text: string): string | null {
  const m = text.match(/in ([A-Za-z][^.]+?) is successful/i)
  return m ? m[1].trim() : null
}

interface ParsedUnitsEmail {
  type: 'units_allocated'
  fundName: string; folio: string | null; orderId: string | null
  units: number; nav: number; date: string; amount: number | null
}
interface ParsedPaymentEmail {
  type: 'payment_confirmed'
  fundName: string; folio: string | null; orderId: string | null
  date: string; amount: number | null
}
type ParsedEmail = ParsedUnitsEmail | ParsedPaymentEmail

function parseEmail(text: string): ParsedEmail | null {
  const fundName = parseFundName(text)
  if (!fundName) return null

  const folio   = field(text, 'Folio Number')
  const orderId = field(text, 'Order ID')
  const amount  = parseMoney(field(text, 'SIP Amount received'))

  // Email type 1: Units Allocated
  const unitsRaw  = field(text, 'Units allocated')
  const navRaw    = field(text, 'NAV')
  const sipDate   = parseDate(field(text, 'SIP Date'))

  if (unitsRaw && navRaw && sipDate) {
    const units = parseFloat(unitsRaw)
    const nav   = parseFloat(navRaw)
    if (!isNaN(units) && !isNaN(nav)) {
      return { type: 'units_allocated', fundName, folio, orderId, units, nav, date: sipDate, amount }
    }
  }

  // Email type 2: Payment confirmed (units still pending)
  if (
    /allotment of units is in.progress/i.test(text) ||
    /SIP Auto Payment/i.test(text) ||
    /Auto payment.*SIP installment/i.test(text)
  ) {
    const date = parseDate(field(text, 'Installment Date'))
               ?? parseDate(field(text, 'SIP Date'))
               ?? new Date().toISOString().split('T')[0]
    return { type: 'payment_confirmed', fundName, folio, orderId, date, amount }
  }

  return null
}

// ─── route ──────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
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
    return NextResponse.json({
      error: 'Unrecognised email format',
      preview: String(body.emailBody).slice(0, 400),
    }, { status: 422 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Payment-only: just log, no holding update
  if (parsed.type === 'payment_confirmed') {
    await supabase.from('sip_history').insert({
      user_id: body.userId, email_type: 'payment_confirmed',
      fund_name: parsed.fundName, folio_number: parsed.folio,
      order_id: parsed.orderId, amount: parsed.amount, sip_date: parsed.date,
      action_taken: 'logged_only',
      notes: 'Units not yet allocated — will update when allocation email arrives',
    })
    return NextResponse.json({ success: true, type: 'payment_confirmed', fund: parsed.fundName, action: 'logged_only' })
  }

  // Units allocated: find holding and update
  let holding: Record<string, unknown> | null = null

  if (parsed.folio) {
    const { data } = await supabase
      .from('mutual_fund_holdings').select('*')
      .eq('user_id', body.userId).eq('folio_number', parsed.folio).maybeSingle()
    holding = data
  }

  if (!holding) {
    // Progressive fuzzy match — try 4 words, then 3, then 2
    const words = parsed.fundName.split(' ')
    for (let len = Math.min(4, words.length); len >= 2; len--) {
      const kw = words.slice(0, len).join(' ')
      const { data } = await supabase
        .from('mutual_fund_holdings').select('*')
        .eq('user_id', body.userId).ilike('scheme_name', `%${kw}%`).maybeSingle()
      if (data) { holding = data; break }
    }
  }

  let action: string
  let holdingId: string | null = null

  if (holding) {
    const oldUnits  = Number(holding.units)
    const oldAvgNav = Number(holding.avg_purchase_nav ?? parsed.nav)
    const newUnits  = oldUnits + parsed.units
    const newAvgNav = (oldUnits * oldAvgNav + parsed.units * parsed.nav) / newUnits
    const oldCost   = Number(holding.cost_basis_inr ?? 0)
    const newCost   = oldCost + (parsed.amount ?? parsed.units * parsed.nav)

    await supabase.from('mutual_fund_holdings').update({
      units: newUnits, avg_purchase_nav: newAvgNav,
      current_nav: parsed.nav, nav_date: parsed.date,
      cost_basis_inr: newCost, current_value_inr: newUnits * parsed.nav,
      folio_number: parsed.folio ?? holding.folio_number,
      sip_active: true, updated_at: new Date().toISOString(),
    }).eq('id', holding.id)

    action = 'updated'
    holdingId = holding.id as string
  } else {
    const { data: newH } = await supabase.from('mutual_fund_holdings').insert({
      user_id: body.userId, scheme_name: parsed.fundName,
      units: parsed.units, avg_purchase_nav: parsed.nav,
      current_nav: parsed.nav, nav_date: parsed.date,
      cost_basis_inr: parsed.amount ?? parsed.units * parsed.nav,
      current_value_inr: parsed.units * parsed.nav,
      folio_number: parsed.folio, sip_active: true,
    }).select('id').single()
    action = 'created'
    holdingId = newH?.id ?? null
  }

  await supabase.from('sip_history').insert({
    user_id: body.userId, email_type: 'units_allocated',
    fund_name: parsed.fundName, folio_number: parsed.folio,
    order_id: parsed.orderId, amount: parsed.amount,
    units: parsed.units, nav: parsed.nav, sip_date: parsed.date,
    action_taken: action, holding_id: holdingId,
  })

  return NextResponse.json({ success: true, type: 'units_allocated', action, fund: parsed.fundName, units: parsed.units })
}
