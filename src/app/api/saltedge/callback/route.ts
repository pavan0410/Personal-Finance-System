import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { fetchConnections, fetchAccounts, mapAccount } from '@/lib/saltedge'

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url)
  const connectionId = searchParams.get('connection_id')

  if (!connectionId) {
    // User cancelled — just go back to accounts
    return NextResponse.redirect(`${origin}/accounts`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/login`)

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
    return NextResponse.redirect(`${origin}/accounts?error=no_customer`)
  }

  try {
    // Fetch all connections to get provider name for this connection
    const connections = await fetchConnections(seCustomer.customer_secret, seCustomer.customer_id)
    const conn = connections.find(c => c.id === connectionId) ?? connections[0]

    if (!conn) {
      return NextResponse.redirect(`${origin}/accounts?error=no_connection`)
    }

    // Fetch and upsert accounts for this connection
    const accounts = await fetchAccounts(seCustomer.customer_secret, conn.id)
    for (const a of accounts) {
      await service
        .from('accounts')
        .upsert(mapAccount(a, user.id, conn.provider_name), { onConflict: 'saltedge_account_id' })
    }

    return NextResponse.redirect(`${origin}/accounts?synced=${accounts.length}`)
  } catch {
    return NextResponse.redirect(`${origin}/accounts?error=sync_failed`)
  }
}
