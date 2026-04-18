'use client'

import { Bell } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'

export function Header({ title }: { title: string }) {
  return (
    <header className="h-14 flex items-center px-6 gap-4 sticky top-0 z-20"
      style={{
        background: 'hsl(var(--background) / 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid hsl(var(--border))',
      }}>
      <h1 className="font-semibold text-base flex-1 tracking-tight">{title}</h1>
      <div className="flex items-center gap-1">
        <button className="p-2 rounded-lg transition-colors"
          style={{ color: 'hsl(var(--muted-foreground))' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; (e.currentTarget as HTMLElement).style.color = 'hsl(var(--foreground))' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground))' }}>
          <Bell className="h-4 w-4" />
        </button>
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
