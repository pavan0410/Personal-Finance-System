import { Header } from '@/components/layout/Header'
import { AccountsClient } from '@/components/accounts/AccountsClient'
import { createClient } from '@/lib/supabase/server'

export default async function AccountsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: accounts = [] } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <>
      <Header title="Accounts" />
      <main className="flex-1 p-6">
        <AccountsClient accounts={accounts ?? []} userId={user!.id} />
      </main>
    </>
  )
}
