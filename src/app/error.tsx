'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center"
      style={{ background: 'hsl(var(--background))' }}>
      <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 8px 24px rgba(239,68,68,0.3)' }}>
        <AlertTriangle className="h-8 w-8 text-white" />
      </div>
      <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
      <p className="text-sm mb-6 max-w-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <button onClick={unstable_retry}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, hsl(246 83% 60%), hsl(280 83% 60%))' }}>
        <RefreshCw className="h-4 w-4" /> Try again
      </button>
    </div>
  )
}
