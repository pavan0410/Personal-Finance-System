'use client'

import { Bell, Search } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'

export function Header({ title }: { title: string }) {
  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-6 gap-4 sticky top-0 z-20">
      <h1 className="font-semibold text-lg flex-1">{title}</h1>

      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <Search className="h-4 w-4" />
        </button>
        <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
        </button>
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
