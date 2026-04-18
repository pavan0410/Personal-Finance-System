'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  const inputCls = 'w-full h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors'

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'hsl(var(--background))' }}>
        <div className="text-center max-w-sm">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 12px 32px rgba(16,185,129,0.35)' }}>
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Check your email</h2>
          <p className="text-sm mb-6" style={{ color: 'hsl(var(--muted-foreground))' }}>
            We sent a confirmation link to <strong style={{ color: 'hsl(var(--foreground))' }}>{email}</strong>. Click it to activate your account.
          </p>
          <Link href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, hsl(246 83% 60%), hsl(280 83% 60%))' }}>
            Back to login →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'hsl(var(--background))' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, hsl(246 83% 60%), transparent)' }} />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, hsl(280 70% 50%), transparent)' }} />
      </div>

      <div className="w-full max-w-md relative">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(135deg, hsl(246 83% 60%), hsl(280 83% 60%))',
              boxShadow: '0 12px 32px rgba(99,102,241,0.4)',
            }}>
            <span className="text-white text-2xl font-bold">W</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
          <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Start tracking your wealth across India & Australia</p>
        </div>

        <div className="rounded-2xl p-8"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
          }}>
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Pavan Kumar" required
                className={inputCls} style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
                className={inputCls} style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={8}
                className={inputCls} style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>At least 8 characters</p>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-500 bg-red-500/10 px-3 py-2.5 rounded-xl">
                <span className="shrink-0 mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-all hover:opacity-90 mt-2"
              style={{
                background: 'linear-gradient(135deg, hsl(246 83% 60%), hsl(280 83% 60%))',
                boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
              }}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create account
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: 'hsl(246 83% 65%)' }}>
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'hsl(var(--muted-foreground))' }}>
          🇮🇳 India · 🇦🇺 Australia · Your finances, unified.
        </p>
      </div>
    </div>
  )
}
