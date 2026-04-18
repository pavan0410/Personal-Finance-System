'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  TrendingUp,
  ArrowLeftRight,
  Building2,
  Target,
  Landmark,
  Home,
  Sparkles,
  CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Overview', href: '/', icon: LayoutDashboard },
  { label: 'Accounts', href: '/accounts', icon: CreditCard },
  { label: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  {
    label: 'Investments',
    icon: TrendingUp,
    children: [
      { label: 'Mutual Funds', href: '/investments/mutual-funds' },
      { label: 'ETFs', href: '/investments/etfs' },
      { label: 'Overview', href: '/investments/overview' },
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
    <aside className="fixed left-0 top-0 h-screen w-60 border-r border-border bg-card flex flex-col z-30">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-sm leading-none">WealthLens</p>
            <p className="text-xs text-muted-foreground mt-0.5">Finance Tracker</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map((item) =>
            item.children ? (
              <li key={item.label}>
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-3 mb-1">
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </div>
                <ul className="ml-3 space-y-0.5">
                  {item.children.map((child) => (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        className={cn(
                          'block px-3 py-2 rounded-md text-sm transition-colors',
                          pathname === child.href
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ) : (
              <li key={item.href}>
                <Link
                  href={item.href!}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    pathname === item.href
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          )}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          India 🇮🇳 · Australia 🇦🇺
        </p>
      </div>
    </aside>
  )
}
