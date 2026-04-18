'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function DashboardError({
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
    <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
      <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 8px 24px rgba(239,68,68,0.25)' }}>
        <AlertTriangle className="h-7 w-7 text-white" />
      </div>
      <h2 className="text-lg font-bold mb-2">Failed to load</h2>
      <p className="text-sm mb-5 max-w-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
        {error.message || 'Something went wrong loading this page.'}
      </p>
      <button onClick={unstable_retry}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, hsl(246 83% 60%), hsl(280 83% 60%))' }}>
        <RefreshCw className="h-3.5 w-3.5" /> Retry
      </button>
    </div>
  )
}
