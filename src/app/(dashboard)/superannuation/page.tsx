import { Header } from '@/components/layout/Header'
import { SuperClient } from '@/components/superannuation/SuperClient'
import { createClient } from '@/lib/supabase/server'

export default async function SuperannuationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: accounts = [] } = await supabase
    .from('superannuation')
    .select('*')
    .eq('user_id', user!.id)

  return (
    <>
      <Header title="Superannuation" />
      <main className="flex-1 p-6">
        <SuperClient accounts={accounts ?? []} userId={user!.id} />
      </main>
    </>
  )
}
