'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        style={{ background: 'hsl(var(--background))' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 h-[500px] w-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 65%)' }} />
          <div className="absolute -bottom-40 -left-32 h-[400px] w-[400px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.14) 0%, transparent 65%)' }} />
          <div className="absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }} />
        </div>
        <div className="text-center max-w-sm relative">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 12px 32px rgba(16,185,129,0.4)' }}>
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2 gradient-text">Check your email</h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(161,174,255,0.5)' }}>
            We sent a confirmation link to{' '}
            <strong style={{ color: 'rgba(220,225,255,0.9)' }}>{email}</strong>.
            Click it to activate your account.
          </p>
          <Link href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 btn-gradient">
            Back to login →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'hsl(var(--background))' }}>

      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 h-[500px] w-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 65%)' }} />
        <div className="absolute -bottom-40 -left-32 h-[400px] w-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.14) 0%, transparent 65%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.07) 0%, transparent 60%)' }} />
        <div className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }} />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-5 pulse-glow"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)',
              boxShadow: '0 12px 40px rgba(99,102,241,0.5)',
            }}>
            <span className="text-white text-2xl font-black">W</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight gradient-text">Create account</h1>
          <p className="mt-2 text-sm" style={{ color: 'rgba(161,174,255,0.5)' }}>Start tracking your wealth across India & Australia</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8"
          style={{
            background: 'rgba(13,16,40,0.85)',
            border: '1px solid rgba(99,102,241,0.2)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.08)',
          }}>
          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2 block"
                style={{ color: 'rgba(161,174,255,0.5)' }}>Full Name</label>
              <input
                type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="Pavan Kumar" required
                className="w-full h-11 px-4 rounded-xl text-sm input-dark"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2 block"
                style={{ color: 'rgba(161,174,255,0.5)' }}>Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className="w-full h-11 px-4 rounded-xl text-sm input-dark"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2 block"
                style={{ color: 'rgba(161,174,255,0.5)' }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={8}
                  className="w-full h-11 px-4 rounded-xl text-sm input-dark"
                  style={{ paddingRight: '44px' }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'rgba(161,174,255,0.4)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgba(161,174,255,0.9)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(161,174,255,0.4)'}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs mt-1.5" style={{ color: 'rgba(161,174,255,0.4)' }}>At least 8 characters</p>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm px-3 py-2.5 rounded-xl"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  color: '#fca5a5',
                }}>
                <span className="shrink-0 mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 btn-gradient mt-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create account
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'rgba(161,174,255,0.4)' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-bold transition-colors"
              style={{ color: '#818cf8' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#a5b4fc'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#818cf8'}>
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(161,174,255,0.3)' }}>
          🇮🇳 India · 🇦🇺 Australia · Your finances, unified.
        </p>
      </div>
    </div>
  )
}
