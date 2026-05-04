import { Header } from '@/components/layout/Header'
import { TransactionsClient } from '@/components/transactions/TransactionsClient'
import { createClient } from '@/lib/supabase/server'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: transactions = [] },
    { data: accounts = [] },
    { data: categories = [] },
    { data: savingsRows = [] },
  ] = await Promise.all([
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user!.id)
      .order('date', { ascending: false })
      .limit(1000),
    supabase.from('accounts').select('id, name, currency').eq('user_id', user!.id),
    supabase
      .from('budget_categories')
      .select('*')
      .eq('user_id', user!.id)
      .order('is_income', { ascending: false })
      .order('name'),
    supabase.from('savings_balance').select('*').eq('user_id', user!.id).limit(1),
  ])

  return (
    <>
      <Header title="Transactions & Budget" />
      <main className="flex-1 p-6">
        <TransactionsClient
          transactions={transactions ?? []}
          categories={categories ?? []}
          savingsBalance={(savingsRows ?? [])[0] ?? null}
          accounts={accounts ?? []}
          userId={user!.id}
        />
      </main>
    </>
  )
}
