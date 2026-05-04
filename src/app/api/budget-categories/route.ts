import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DEFAULT_CATS = [
  { name: 'Food & Dining', emoji: '🍔', color: '#f59e0b', monthly_budget: 800, is_income: false },
  { name: 'Transport', emoji: '🚗', color: '#3b82f6', monthly_budget: 300, is_income: false },
  { name: 'Utilities & Bills', emoji: '⚡', color: '#8b5cf6', monthly_budget: 400, is_income: false },
  { name: 'Healthcare', emoji: '🏥', color: '#10b981', monthly_budget: 200, is_income: false },
  { name: 'Entertainment', emoji: '🎬', color: '#ec4899', monthly_budget: 200, is_income: false },
  { name: 'Shopping', emoji: '🛍️', color: '#f97316', monthly_budget: 300, is_income: false },
  { name: 'Investment', emoji: '📈', color: '#6366f1', monthly_budget: 0, is_income: false },
  { name: 'Insurance', emoji: '🛡️', color: '#14b8a6', monthly_budget: 200, is_income: false },
  { name: 'Salary', emoji: '💼', color: '#34d399', monthly_budget: 0, is_income: true },
  { name: 'Other', emoji: '💡', color: '#6b7280', monthly_budget: 200, is_income: false },
]

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  // Seed defaults
  if (body.seed_defaults) {
    const rows = DEFAULT_CATS.map(c => ({ ...c, user_id: user.id }))
    const { data, error } = await supabase.from('budget_categories').insert(rows).select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ categories: data })
  }

  // Single category create
  const { name, emoji = '💰', color = '#6366f1', monthly_budget = 0, is_income = false } = body
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('budget_categories')
    .insert({ user_id: user.id, name, emoji, color, monthly_budget, is_income })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ category: data })
}
