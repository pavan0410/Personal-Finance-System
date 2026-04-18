import { Header } from '@/components/layout/Header'
import { GoalsClient } from '@/components/goals/GoalsClient'
import { createClient } from '@/lib/supabase/server'

export default async function GoalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: goals = [] } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user!.id)
    .order('target_date', { ascending: true })

  return (
    <>
      <Header title="Financial Goals" />
      <main className="flex-1 p-6">
        <GoalsClient goals={goals ?? []} userId={user!.id} />
      </main>
    </>
  )
}
