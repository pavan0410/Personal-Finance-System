'use client'

import { Bell } from 'lucide-react'
import { UserMenu } from './UserMenu'

export function Header({ title }: { title: string }) {
  return (
    <header className="h-14 flex items-center px-6 gap-4 sticky top-0 z-20"
      style={{
        background: 'rgba(6,7,16,0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(99,102,241,0.15)',
        boxShadow: '0 1px 0 rgba(99,102,241,0.08)',
      }}>
      <h1 className="font-bold text-base flex-1 tracking-tight gradient-text">{title}</h1>
      <div className="flex items-center gap-1">
        <button
          className="p-2 rounded-lg transition-all duration-150"
          style={{ color: 'rgba(161,174,255,0.5)' }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(99,102,241,0.12)'
            el.style.color = 'rgba(161,174,255,0.9)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.background = ''
            el.style.color = 'rgba(161,174,255,0.5)'
          }}>
          <Bell className="h-4 w-4" />
        </button>
        <UserMenu />
      </div>
    </header>
  )
}
