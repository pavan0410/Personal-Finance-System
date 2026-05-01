import { Header } from '@/components/layout/Header'
import { CSVImport } from '@/components/transactions/CSVImport'
import { createClient } from '@/lib/supabase/server'

export default async function ImportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: accounts = [] } = await supabase
    .from('accounts')
    .select('id, name')
    .eq('user_id', user!.id)
    .eq('is_active', true)
    .order('name')

  return (
    <>
      <Header title="Import Transactions" />
      <main className="flex-1 p-6">
        <CSVImport accounts={accounts ?? []} />
      </main>
    </>
  )
}
