import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface IncomingTransaction {
  date: string
  description: string
  amount: number
  type: 'income' | 'expense' | 'transfer'
  category: string
  account_id?: string | null
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.transactions?.length) {
    return NextResponse.json({ error: 'No transactions provided' }, { status: 400 })
  }

  const transactions: IncomingTransaction[] = body.transactions

  // ── Fetch existing transactions to deduplicate ────────────────────────────
  // Load transactions from last 2 years to check against
  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

  const { data: existing } = await supabase
    .from('transactions')
    .select('date, amount, description')
    .eq('user_id', user.id)
    .gte('date', twoYearsAgo.toISOString().split('T')[0])

  const existingSet = new Set(
    (existing ?? []).map(t => `${t.date}|${t.amount}|${t.description.toLowerCase().trim()}`)
  )

  // ── Split into new vs duplicate ───────────────────────────────────────────
  const toInsert: IncomingTransaction[] = []
  const duplicates: IncomingTransaction[] = []

  for (const t of transactions) {
    const key = `${t.date}|${Math.abs(t.amount)}|${t.description.toLowerCase().trim()}`
    // Check both exact amount and absolute value (CommBank uses negative for expenses)
    const keyNeg = `${t.date}|${t.amount}|${t.description.toLowerCase().trim()}`
    if (existingSet.has(key) || existingSet.has(keyNeg)) {
      duplicates.push(t)
    } else {
      toInsert.push(t)
    }
  }

  if (toInsert.length === 0) {
    return NextResponse.json({ inserted: 0, duplicates: duplicates.length, message: 'All transactions already imported' })
  }

  // ── Insert new transactions ───────────────────────────────────────────────
  const rows = toInsert.map(t => ({
    user_id: user.id,
    date: t.date,
    description: t.description,
    amount: Math.abs(t.amount),   // always store positive; type encodes direction
    currency: 'AUD',
    type: t.type,
    category: t.category || null,
    account_id: t.account_id || null,
  }))

  const { error } = await supabase.from('transactions').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    inserted: toInsert.length,
    duplicates: duplicates.length,
    total: transactions.length,
  })
}
