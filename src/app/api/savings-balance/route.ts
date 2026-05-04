import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { balance, as_of_date } = body
  if (balance === undefined || !as_of_date) {
    return NextResponse.json({ error: 'balance and as_of_date are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('savings_balance')
    .upsert(
      { user_id: user.id, balance: Number(balance), as_of_date, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ savingsBalance: data })
}
