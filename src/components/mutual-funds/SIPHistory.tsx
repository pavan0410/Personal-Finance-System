'use client'

import { CheckCircle2, Clock, Plus, AlertCircle } from 'lucide-react'

interface SIPEvent {
  id: string
  created_at: string
  email_type: 'units_allocated' | 'payment_confirmed'
  fund_name: string
  folio_number: string | null
  order_id: string | null
  amount: number | null
  units: number | null
  nav: number | null
  sip_date: string | null
  action_taken: string | null
  notes: string | null
}

function formatINR(n: number) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

const ACTION_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  updated:    { bg: 'rgba(16,185,129,0.1)',  text: '#10b981', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  created:    { bg: 'rgba(99,102,241,0.1)',  text: 'hsl(246 83% 65%)', icon: <Plus className="h-3.5 w-3.5" /> },
  logged_only:{ bg: 'rgba(245,158,11,0.1)',  text: '#f59e0b', icon: <Clock className="h-3.5 w-3.5" /> },
  error:      { bg: 'rgba(239,68,68,0.1)',   text: '#ef4444', icon: <AlertCircle className="h-3.5 w-3.5" /> },
}

export function SIPHistory({ events }: { events: SIPEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-3"
          style={{ background: 'hsl(var(--muted))' }}>
          <Clock className="h-6 w-6" style={{ color: 'hsl(var(--muted-foreground))' }} />
        </div>
        <p className="font-medium text-sm">No sync history yet</p>
        <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Events will appear here once the Gmail automation detects SIP emails
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
      {events.map((e) => {
        const style = ACTION_STYLES[e.action_taken ?? 'error'] ?? ACTION_STYLES.error
        const isUnits = e.email_type === 'units_allocated'
        const date = e.created_at ? new Date(e.created_at).toLocaleString('en-AU', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        }) : '—'

        return (
          <div key={e.id} className="px-6 py-4 flex items-start gap-4">
            {/* Icon */}
            <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: style.bg, color: style.text }}>
              {style.icon}
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm truncate">{e.fund_name}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0"
                  style={{ background: style.bg, color: style.text }}>
                  {e.action_taken === 'updated' ? 'Updated' :
                   e.action_taken === 'created' ? 'New holding' :
                   e.action_taken === 'logged_only' ? 'Payment logged' : 'Error'}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                  style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                  {isUnits ? '📩 Units allocated' : '💳 Payment confirmed'}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5">
                {e.amount != null && (
                  <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Amount: <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>{formatINR(e.amount)}</span>
                  </span>
                )}
                {e.units != null && (
                  <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Units: <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>+{e.units.toFixed(4)}</span>
                  </span>
                )}
                {e.nav != null && (
                  <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    NAV: <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>₹{e.nav}</span>
                  </span>
                )}
                {e.folio_number && (
                  <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Folio: {e.folio_number}
                  </span>
                )}
                {e.sip_date && (
                  <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    SIP Date: {e.sip_date}
                  </span>
                )}
              </div>

              {e.notes && (
                <p className="text-xs mt-1 italic" style={{ color: 'hsl(var(--muted-foreground))' }}>{e.notes}</p>
              )}
            </div>

            {/* Timestamp */}
            <p className="text-xs shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>{date}</p>
          </div>
        )
      })}
    </div>
  )
}
