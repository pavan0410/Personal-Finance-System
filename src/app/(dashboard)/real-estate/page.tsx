import { Header } from '@/components/layout/Header'
import { RealEstateClient } from '@/components/real-estate/RealEstateClient'
import { createClient } from '@/lib/supabase/server'

export default async function RealEstatePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: properties = [] } = await supabase
    .from('real_estate')
    .select('*')
    .eq('user_id', user!.id)

  return (
    <>
      <Header title="Real Estate" />
      <main className="flex-1 p-6">
        <RealEstateClient properties={properties ?? []} userId={user!.id} />
      </main>
    </>
  )
}
