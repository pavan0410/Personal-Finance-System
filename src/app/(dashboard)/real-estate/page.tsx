import { Header } from '@/components/layout/Header'
import { RealEstateClient } from '@/components/real-estate/RealEstateClient'
import { createClient } from '@/lib/supabase/server'

export default async function RealEstatePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: properties = [] },
    { data: expenses = [] },
    { data: income = [] },
  ] = await Promise.all([
    supabase.from('real_estate').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
    supabase.from('real_estate_expenses').select('*').eq('user_id', user!.id).order('date', { ascending: false }),
    supabase.from('real_estate_income').select('*').eq('user_id', user!.id).order('date', { ascending: false }),
  ])

  return (
    <>
      <Header title="Real Estate" />
      <main className="flex-1 p-6">
        <RealEstateClient
          properties={properties ?? []}
          expenses={expenses ?? []}
          income={income ?? []}
          userId={user!.id}
        />
      </main>
    </>
  )
}
