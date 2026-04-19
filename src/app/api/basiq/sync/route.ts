import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getBasiqToken, fetchBasiqAccounts, mapBasiqAccount } from '@/lib/basiq'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: basiqUser } = await service
    .from('basiq_users')
    .select('basiq_user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!basiqUser?.basiq_user_id) {
    return NextResponse.json({ error: 'No bank connected. Use Connect Bank first.' }, { status: 400 })
  }

  try {
    const token = await getBasiqToken()
    const accounts = await fetchBasiqAccounts(token, basiqUser.basiq_user_id)

    let synced = 0
    for (const a of accounts) {
      const mapped = mapBasiqAccount(a, user.id)
      const { error } = await service
        .from('accounts')
        .upsert(mapped, { onConflict: 'basiq_account_id' })
      if (!error) synced++
    }

    return NextResponse.json({ success: true, synced })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
