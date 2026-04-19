import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { fetchConnections, fetchAccounts, mapAccount } from '@/lib/saltedge'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: seCustomer } = await service
    .from('saltedge_customers')
    .select('customer_id, customer_secret')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!seCustomer) {
    return NextResponse.json({ error: 'No bank connected yet.' }, { status: 400 })
  }

  try {
    const connections = await fetchConnections(seCustomer.customer_secret, seCustomer.customer_id)
    let synced = 0

    for (const conn of connections) {
      const accounts = await fetchAccounts(seCustomer.customer_secret, conn.id)
      for (const a of accounts) {
        const { error } = await service
          .from('accounts')
          .upsert(mapAccount(a, user.id, conn.provider_name), { onConflict: 'saltedge_account_id' })
        if (!error) synced++
      }
    }

    return NextResponse.json({ success: true, synced })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
