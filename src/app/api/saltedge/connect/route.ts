import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createCustomer, createConnectSession } from '@/lib/saltedge'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  try {
    // Get or create Salt Edge customer
    const { data: existing } = await service
      .from('saltedge_customers')
      .select('customer_id, customer_secret')
      .eq('user_id', user.id)
      .maybeSingle()

    let customerId = existing?.customer_id
    let customerSecret = existing?.customer_secret

    if (!customerId) {
      const customer = await createCustomer(user.id)
      customerId = customer.id
      customerSecret = customer.secret
      await service.from('saltedge_customers').insert({
        user_id: user.id,
        customer_id: customerId,
        customer_secret: customerSecret,
      })
    }

    // Build return_to URL from request host
    const origin = new URL(req.url).origin
    const returnTo = `${origin}/api/saltedge/callback`

    const connectUrl = await createConnectSession(customerSecret!, customerId, returnTo)
    return NextResponse.json({ url: connectUrl })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
