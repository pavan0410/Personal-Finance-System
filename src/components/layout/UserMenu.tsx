'use client'

import { LogOut, Settings, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function UserMenu() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="relative group">
      <button
        className="h-8 w-8 rounded-full flex items-center justify-center transition-all duration-150"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))',
          border: '1px solid rgba(99,102,241,0.4)',
          color: '#a5b4fc',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.5))'
          el.style.boxShadow = '0 0 16px rgba(99,102,241,0.4)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))'
          el.style.boxShadow = ''
        }}>
        <User className="h-3.5 w-3.5" />
      </button>
      <div className="absolute right-0 top-10 w-44 rounded-xl py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50"
        style={{
          background: 'rgba(10,12,28,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99,102,241,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.08)',
        }}>
        <button
          onClick={() => router.push('/settings')}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm transition-colors text-left"
          style={{ color: 'rgba(200,210,255,0.7)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.1)'; (e.currentTarget as HTMLElement).style.color = 'rgba(200,210,255,1)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'rgba(200,210,255,0.7)' }}
        >
          <Settings className="h-3.5 w-3.5" /> Settings
        </button>
        <div style={{ borderTop: '1px solid rgba(99,102,241,0.15)', margin: '2px 0' }} />
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm transition-colors text-left"
          style={{ color: 'rgba(252,129,129,0.8)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLElement).style.color = '#fca5a5' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'rgba(252,129,129,0.8)' }}
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>
    </div>
  )
}
