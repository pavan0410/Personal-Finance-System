'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  const inputCls = 'w-full h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors'

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'hsl(var(--background))' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, hsl(246 83% 60%), transparent)' }} />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, hsl(280 70% 50%), transparent)' }} />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(135deg, hsl(246 83% 60%), hsl(280 83% 60%))',
              boxShadow: '0 12px 32px rgba(99,102,241,0.4)',
            }}>
            <span className="text-white text-2xl font-bold">W</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Sign in to WealthLens</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 shadow-xl"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
          }}>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className={inputCls}
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required
                  className={inputCls} style={{ paddingRight: '2.75rem', border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
              Sign in
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold hover:underline" style={{ color: 'hsl(246 83% 65%)' }}>
              Sign up
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
