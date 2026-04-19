import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getBasiqToken, createBasiqUser, getConsentUrl } from '@/lib/basiq'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.BASIQ_API_KEY) {
    return NextResponse.json({ error: 'BASIQ_API_KEY env var is not set' }, { status: 500 })
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  let step = 'token'
  try {
    const token = await getBasiqToken()

    step = 'db-lookup'
    const { data: existing, error: dbErr } = await service
      .from('basiq_users')
      .select('basiq_user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (dbErr) {
      return NextResponse.json({ error: `DB error (run SQL migration?): ${dbErr.message}` }, { status: 500 })
    }

    let basiqUserId = existing?.basiq_user_id

    if (!basiqUserId) {
      step = 'create-user'
      basiqUserId = await createBasiqUser(token, user.email!)
      await service.from('basiq_users').insert({ user_id: user.id, basiq_user_id: basiqUserId })
    }

    step = 'consent-url'
    const consentUrl = await getConsentUrl(token, basiqUserId)
    return NextResponse.json({ url: consentUrl })
  } catch (err) {
    return NextResponse.json({ error: String(err), step }, { status: 500 })
  }
}
