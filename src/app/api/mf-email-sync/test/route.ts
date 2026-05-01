// Browser-callable version of mf-email-sync — uses session auth instead of secret
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { emailBody } = await req.json().catch(() => ({}))
  if (!emailBody) return NextResponse.json({ error: 'Missing emailBody' }, { status: 400 })

  // Forward to the real sync endpoint using the shared secret
  const base = new URL(req.url).origin
  const res = await fetch(`${base}/api/mf-email-sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-sync-secret': process.env.MF_SYNC_SECRET!,
    },
    body: JSON.stringify({ emailBody, userId: user.id }),
  })

  const data = await res.json()
  return NextResponse.json({ status: res.status, ...data })
}
