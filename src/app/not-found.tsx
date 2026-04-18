import Link from 'next/link'
import { Home, SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center"
      style={{ background: 'hsl(var(--background))' }}>
      <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'linear-gradient(135deg, hsl(246 83% 60%), hsl(280 83% 60%))', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
        <SearchX className="h-8 w-8 text-white" />
      </div>
      <h2 className="text-xl font-bold mb-2">Page not found</h2>
      <p className="text-sm mb-6 max-w-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/"
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, hsl(246 83% 60%), hsl(280 83% 60%))' }}>
        <Home className="h-4 w-4" /> Go to Dashboard
      </Link>
    </div>
  )
}
