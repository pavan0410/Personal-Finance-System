'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, TrendingUp, ArrowLeftRight,
  Target, Landmark, Home, Sparkles, CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Overview',       href: '/',                    icon: LayoutDashboard },
  { label: 'Accounts',       href: '/accounts',            icon: CreditCard },
  { label: 'Transactions',   href: '/transactions',        icon: ArrowLeftRight },
  {
    label: 'Investments', icon: TrendingUp,
    children: [
      { label: 'Mutual Funds', href: '/investments/mutual-funds', flag: '🇮🇳' },
      { label: 'ETFs',         href: '/investments/etfs',         flag: '🇦🇺' },
      { label: 'Overview',     href: '/investments/overview',     flag: '📊' },
    ],
  },
  { label: 'Superannuation', href: '/superannuation',      icon: Landmark },
  { label: 'Real Estate',    href: '/real-estate',         icon: Home },
  { label: 'Goals',          href: '/goals',               icon: Target },
  { label: 'AI Insights',    href: '/insights',            icon: Sparkles },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col z-30"
      style={{
        background: 'hsl(var(--sidebar))',
        borderRight: '1px solid rgba(99,102,241,0.12)',
      }}>

      {/* Subtle gradient glow at top */}
      <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% -20%, rgba(99,102,241,0.2) 0%, transparent 70%)' }} />

      {/* Logo */}
      <div className="relative px-5 py-5" style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 pulse-glow"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 4px 16px rgba(99,102,241,0.5)',
            }}>
            <span className="text-white text-sm font-bold">W</span>
          </div>
          <div>
            <p className="font-bold text-sm leading-tight text-white">WealthLens</p>
            <p className="text-[11px] leading-tight" style={{ color: 'rgba(161,174,255,0.6)' }}>Personal Finance</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="relative flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {navItems.map((item) =>
          item.children ? (
            <div key={item.label} className="pt-3">
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(161,174,255,0.4)' }}>
                {item.label}
              </p>
              {item.children.map((child) => {
                const active = pathname === child.href
                return (
                  <Link key={child.href} href={child.href}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 mb-0.5 group',
                    )}
                    style={active ? {
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.2))',
                      color: '#a5b4fc',
                      fontWeight: 600,
                      borderLeft: '2px solid #6366f1',
                      paddingLeft: '10px',
                      boxShadow: '0 2px 12px rgba(99,102,241,0.2)',
                    } : {
                      color: 'rgba(161,174,255,0.55)',
                      borderLeft: '2px solid transparent',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        const el = e.currentTarget as HTMLElement
                        el.style.background = 'rgba(99,102,241,0.1)'
                        el.style.color = 'rgba(200,210,255,0.9)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        const el = e.currentTarget as HTMLElement
                        el.style.background = ''
                        el.style.color = 'rgba(161,174,255,0.55)'
                      }
                    }}
                  >
                    {child.flag && <span className="text-xs">{child.flag}</span>}
                    {child.label}
                  </Link>
                )
              })}
            </div>
          ) : (
            (() => {
              const active = pathname === item.href!
              return (
                <Link key={item.href} href={item.href!}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150"
                  style={active ? {
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.28), rgba(139,92,246,0.22))',
                    color: '#a5b4fc',
                    fontWeight: 600,
                    borderLeft: '2px solid #6366f1',
                    paddingLeft: '10px',
                    boxShadow: '0 2px 16px rgba(99,102,241,0.22)',
                  } : {
                    color: 'rgba(161,174,255,0.55)',
                    borderLeft: '2px solid transparent',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = 'rgba(99,102,241,0.1)'
                      el.style.color = 'rgba(200,210,255,0.9)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = ''
                      el.style.color = 'rgba(161,174,255,0.55)'
                    }
                  }}
                >
                  <item.icon className="h-4 w-4 shrink-0" style={{ color: active ? '#818cf8' : 'inherit' }} />
                  <span>{item.label}</span>
                  {item.label === 'AI Insights' && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}>
                      AI
                    </span>
                  )}
                </Link>
              )
            })()
          )
        )}
      </nav>

      {/* Footer */}
      <div className="relative px-5 pt-4 pb-10" style={{ borderTop: '1px solid rgba(99,102,241,0.12)' }}>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-xs" style={{ color: 'rgba(161,174,255,0.45)' }}>
            🇮🇳 India · 🇦🇺 Australia
          </p>
        </div>
      </div>
    </aside>
  )
}
