import { Header } from '@/components/layout/Header'
import { TransactionsClient } from '@/components/transactions/TransactionsClient'
import { createClient } from '@/lib/supabase/server'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: transactions = [] }, { data: accounts = [] }] = await Promise.all([
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user!.id)
      .order('date', { ascending: false })
      .limit(200),
    supabase.from('accounts').select('id, name, currency').eq('user_id', user!.id),
  ])

  return (
    <>
      <Header title="Transactions" />
      <main className="flex-1 p-6">
        <TransactionsClient
          transactions={transactions ?? []}
          accounts={accounts ?? []}
          userId={user!.id}
        />
      </main>
    </>
  )
}
