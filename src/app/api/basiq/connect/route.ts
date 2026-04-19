import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getBasiqToken, createBasiqUser, getConsentUrl } from '@/lib/basiq'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  try {
    const token = await getBasiqToken()

    // Check if we already have a Basiq user for this app user
    const { data: existing } = await service
      .from('basiq_users')
      .select('basiq_user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    let basiqUserId = existing?.basiq_user_id

    if (!basiqUserId) {
      basiqUserId = await createBasiqUser(token, user.email!)
      await service.from('basiq_users').insert({ user_id: user.id, basiq_user_id: basiqUserId })
    }

    const consentUrl = await getConsentUrl(token, basiqUserId)
    return NextResponse.json({ url: consentUrl })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
