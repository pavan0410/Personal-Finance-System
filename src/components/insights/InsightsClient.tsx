'use client'

import { useState } from 'react'
import { Sparkles, Send, Loader2, RefreshCw, MessageSquare } from 'lucide-react'

const PRESET_QUESTIONS = [
  'Give me a complete portfolio health check — diversification, concentration risks, and what to fix.',
  'Am I on track to hit my financial goals? What should I invest more in?',
  'Analyse my Indian mutual funds — am I in the right categories? What should I change?',
  'What ASX ETFs should I consider to complement my current holdings?',
  'How can I optimise my superannuation contributions this financial year?',
  'What are the tax implications of my Indian investments as an Australian tax resident?',
  'Suggest a monthly investment plan across MFs and ETFs to grow my wealth in 10 years.',
]

interface Props {
  portfolioSnapshot: Record<string, unknown>
}

export function InsightsClient({ portfolioSnapshot }: Props) {
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<Array<{ q: string; a: string }>>([])

  async function askQuestion(q: string) {
    if (!q.trim() || loading) return
    setLoading(true)
    setResponse('')
    setQuestion('')

    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, portfolioSnapshot }),
      })

      if (!res.ok) throw new Error('Failed to get insights')

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let fullResponse = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        fullResponse += text
        setResponse(fullResponse)
      }

      setHistory(h => [{ q, a: fullResponse }, ...h.slice(0, 4)])
    } catch {
      setResponse('Sorry, I could not generate insights right now. Please check your API key and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero banner */}
      <div className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(246 83% 50%) 0%, hsl(265 83% 55%) 50%, hsl(280 70% 50%) 100%)',
          boxShadow: '0 20px 60px hsl(246 83% 50% / 0.3)',
        }}>
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10" style={{ background: 'white' }} />
        <div className="absolute -right-2 -bottom-6 h-20 w-20 rounded-full opacity-10" style={{ background: 'white' }} />
        <div className="relative flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-white">WealthLens AI</h2>
            <p className="text-sm text-white/70 mt-0.5">Powered by Claude · Indian & Australian markets specialist</p>
            <p className="text-sm text-white/80 mt-3 leading-relaxed max-w-2xl">
              Ask me anything about your portfolio — fund recommendations, goal analysis, tax optimisation for DTAA, or a complete financial health check. I analyse your real portfolio data to give specific, actionable advice.
            </p>
          </div>
        </div>
      </div>

      {/* Preset questions */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>Quick Questions</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_QUESTIONS.map((q) => (
            <button key={q} onClick={() => askQuestion(q)} disabled={loading}
              className="text-xs px-3 py-2 rounded-xl text-left transition-all disabled:opacity-50"
              style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(246 83% 60% / 0.08)'; (e.currentTarget as HTMLElement).style.borderColor = 'hsl(246 83% 60% / 0.4)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))' }}>
              {q.length > 65 ? q.slice(0, 63) + '…' : q}
            </button>
          ))}
        </div>
      </div>

      {/* Input area */}
      <div className="rounded-2xl p-4" style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); askQuestion(question) } }}
              placeholder="Ask about your portfolio, investment strategy, goals... (Enter to send)"
              rows={3}
              className="w-full bg-transparent text-sm resize-none focus:outline-none"
              style={{ color: 'hsl(var(--foreground))' }}
            />
          </div>
          <button onClick={() => askQuestion(question)} disabled={loading || !question.trim()}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center gap-2 transition-all hover:opacity-90 shrink-0"
            style={{ background: 'linear-gradient(135deg, hsl(246 83% 60%), hsl(280 83% 60%))', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Ask
          </button>
        </div>
      </div>

      {/* Streaming response */}
      {(loading || response) && (
        <div className="rounded-2xl p-6" style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}>
          <div className="flex items-center gap-2 mb-5" style={{ borderBottom: '1px solid hsl(var(--border))', paddingBottom: '1rem' }}>
            <div className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(246 83% 60%), hsl(280 83% 60%))' }}>
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold">AI Analysis</span>
            {loading && (
              <div className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
              </div>
            )}
          </div>
          <div className="space-y-2 text-sm leading-relaxed">
            {response.split('\n').map((line, i) => {
              if (line.startsWith('## ')) return (
                <h3 key={i} className="font-bold text-base mt-5 mb-2" style={{ color: 'hsl(246 83% 65%)' }}>{line.slice(3)}</h3>
              )
              if (line.startsWith('### ')) return (
                <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
              )
              if (line.startsWith('- ') || line.startsWith('* ')) return (
                <div key={i} className="flex items-start gap-2 ml-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: 'hsl(246 83% 60%)' }} />
                  <p>{line.slice(2)}</p>
                </div>
              )
              if (line.startsWith('**') && line.endsWith('**')) return (
                <p key={i} className="font-bold">{line.slice(2, -2)}</p>
              )
              if (line.trim() === '') return <div key={i} className="h-2" />
              return <p key={i}>{line}</p>
            })}
            {loading && <span className="inline-block w-1 h-4 rounded animate-pulse ml-0.5"
              style={{ background: 'hsl(246 83% 60%)' }} />}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>Previous Questions</p>
          <div className="space-y-3">
            {history.slice(1).map((item, i) => (
              <div key={i} className="rounded-xl p-4 transition-colors"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" style={{ color: 'hsl(246 83% 65%)' }} />
                    <p className="text-sm font-medium">{item.q}</p>
                  </div>
                  <button onClick={() => { setResponse(item.a); setQuestion('') }}
                    className="shrink-0 p-1 rounded-lg transition-colors"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-xs line-clamp-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{item.a.slice(0, 200)}…</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
