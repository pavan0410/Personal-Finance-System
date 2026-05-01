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

const CARD = {
  background: 'rgba(13,16,40,0.8)',
  border: '1px solid rgba(99,102,241,0.15)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
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
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)',
          boxShadow: '0 20px 60px rgba(99,102,241,0.35)',
        }}>
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)' }} />
        <div className="absolute -right-2 -bottom-6 h-20 w-20 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)' }} />
        <div className="relative flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-lg text-white">WealthLens AI</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-black"
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                AI
              </span>
            </div>
            <p className="text-sm text-white/60 mt-0.5">Powered by Claude · Indian & Australian markets specialist</p>
            <p className="text-sm text-white/80 mt-3 leading-relaxed max-w-2xl">
              Ask me anything about your portfolio — fund recommendations, goal analysis, tax optimisation for DTAA, or a complete financial health check. I analyse your real portfolio data to give specific, actionable advice.
            </p>
          </div>
        </div>
      </div>

      {/* Preset questions */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-3"
          style={{ color: 'rgba(161,174,255,0.5)' }}>Quick Questions</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_QUESTIONS.map((q) => (
            <button key={q} onClick={() => askQuestion(q)} disabled={loading}
              className="text-xs px-3 py-2 rounded-xl text-left transition-all disabled:opacity-50"
              style={{
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.2)',
                color: 'rgba(165,180,252,0.75)',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = 'rgba(99,102,241,0.15)'
                el.style.borderColor = 'rgba(99,102,241,0.4)'
                el.style.color = '#a5b4fc'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = 'rgba(99,102,241,0.08)'
                el.style.borderColor = 'rgba(99,102,241,0.2)'
                el.style.color = 'rgba(165,180,252,0.75)'
              }}>
              {q.length > 65 ? q.slice(0, 63) + '…' : q}
            </button>
          ))}
        </div>
      </div>

      {/* Input area */}
      <div className="rounded-2xl p-4" style={CARD}>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); askQuestion(question) } }}
              placeholder="Ask about your portfolio, investment strategy, goals... (Enter to send)"
              rows={3}
              className="w-full bg-transparent text-sm resize-none focus:outline-none"
              style={{ color: 'rgba(220,225,255,0.85)' }}
            />
          </div>
          <button onClick={() => askQuestion(question)} disabled={loading || !question.trim()}
            className="px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 btn-gradient shrink-0 disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Ask
          </button>
        </div>
      </div>

      {/* Streaming response */}
      {(loading || response) && (
        <div className="rounded-2xl p-6" style={CARD}>
          <div className="flex items-center gap-3 mb-5 pb-4"
            style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
            <div className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
              }}>
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white">AI Analysis</span>
            {loading && (
              <div className="ml-auto flex items-center gap-1.5 text-xs"
                style={{ color: 'rgba(161,174,255,0.5)' }}>
                <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
              </div>
            )}
          </div>
          <div className="space-y-2 text-sm leading-relaxed" style={{ color: 'rgba(220,225,255,0.85)' }}>
            {response.split('\n').map((line, i) => {
              if (line.startsWith('## ')) return (
                <h3 key={i} className="font-black text-base mt-5 mb-2 gradient-text">{line.slice(3)}</h3>
              )
              if (line.startsWith('### ')) return (
                <h4 key={i} className="font-bold text-sm mt-3 mb-1" style={{ color: '#a5b4fc' }}>{line.slice(4)}</h4>
              )
              if (line.startsWith('- ') || line.startsWith('* ')) return (
                <div key={i} className="flex items-start gap-2 ml-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ background: '#6366f1' }} />
                  <p>{line.slice(2)}</p>
                </div>
              )
              if (line.startsWith('**') && line.endsWith('**')) return (
                <p key={i} className="font-bold text-white">{line.slice(2, -2)}</p>
              )
              if (line.trim() === '') return <div key={i} className="h-2" />
              return <p key={i}>{line}</p>
            })}
            {loading && (
              <span className="inline-block w-1 h-4 rounded animate-pulse ml-0.5"
                style={{ background: '#6366f1' }} />
            )}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-3"
            style={{ color: 'rgba(161,174,255,0.5)' }}>Previous Questions</p>
          <div className="space-y-3">
            {history.slice(1).map((item, i) => (
              <div key={i} className="rounded-xl p-4 transition-colors" style={CARD}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" style={{ color: '#818cf8' }} />
                    <p className="text-sm font-medium text-white">{item.q}</p>
                  </div>
                  <button onClick={() => { setResponse(item.a); setQuestion('') }}
                    className="shrink-0 p-1 rounded-lg transition-all"
                    style={{ color: 'rgba(161,174,255,0.4)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.12)'; (e.currentTarget as HTMLElement).style.color = '#a5b4fc' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'rgba(161,174,255,0.4)' }}>
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-xs line-clamp-2" style={{ color: 'rgba(161,174,255,0.4)' }}>
                  {item.a.slice(0, 200)}…
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
