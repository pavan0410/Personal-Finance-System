'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, TrendingUp, ArrowLeftRight,
  Target, Landmark, Home, Sparkles, CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Overview', href: '/', icon: LayoutDashboard },
  { label: 'Accounts', href: '/accounts', icon: CreditCard },
  { label: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  {
    label: 'Investments', icon: TrendingUp,
    children: [
      { label: 'Mutual Funds', href: '/investments/mutual-funds', flag: '🇮🇳' },
      { label: 'ETFs', href: '/investments/etfs', flag: '🇦🇺' },
      { label: 'Overview', href: '/investments/overview', flag: '' },
    ],
  },
  { label: 'Superannuation', href: '/superannuation', icon: Landmark },
  { label: 'Real Estate', href: '/real-estate', icon: Home },
  { label: 'Goals', href: '/goals', icon: Target },
  { label: 'AI Insights', href: '/insights', icon: Sparkles },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col z-30"
      style={{ background: 'hsl(var(--sidebar))', borderRight: '1px solid hsl(var(--sidebar-border))' }}>

      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid hsl(var(--sidebar-border))' }}>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, hsl(246 83% 60%), hsl(280 83% 60%))' }}>
            <span className="text-white text-sm font-bold">W</span>
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">WealthLens</p>
            <p className="text-xs leading-tight" style={{ color: 'hsl(var(--muted-foreground))' }}>Personal Finance</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {navItems.map((item) =>
          item.children ? (
            <div key={item.label} className="pt-3">
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                {item.label}
              </p>
              {item.children.map((child) => {
                const active = pathname === child.href
                return (
                  <Link key={child.href} href={child.href}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 mb-0.5',
                      active
                        ? 'font-medium'
                        : 'hover:opacity-100'
                    )}
                    style={active ? {
                      background: 'hsl(var(--accent))',
                      color: 'hsl(var(--accent-foreground))',
                    } : {
                      color: 'hsl(var(--muted-foreground))',
                    }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; (e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))' }}
                    onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground))' } }}
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
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                  )}
                  style={active ? {
                    background: 'hsl(var(--accent))',
                    color: 'hsl(var(--accent-foreground))',
                    fontWeight: 500,
                  } : {
                    color: 'hsl(var(--muted-foreground))',
                  }}
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; (e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))' } }}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground))' } }}
                >
                  <item.icon className={cn('h-4 w-4 shrink-0', active && 'text-primary')} />
                  {item.label}
                  {item.label === 'AI Insights' && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ background: 'hsl(246 83% 60% / 0.15)', color: 'hsl(246 83% 65%)' }}>
                      AI
                    </span>
                  )}
                </Link>
              )
            })()
          )
        )}
      </nav>

      {/* Footer — extra bottom padding avoids Next.js dev overlay overlap */}
      <div className="px-5 pt-4 pb-10" style={{ borderTop: '1px solid hsl(var(--sidebar-border))' }}>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            🇮🇳 India · 🇦🇺 Australia
          </p>
        </div>
      </div>
    </aside>
  )
}
