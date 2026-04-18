'use client'

import { useState } from 'react'
import { Sparkles, Send, Loader2, RefreshCw } from 'lucide-react'

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
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200 dark:border-indigo-800 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold">WealthLens AI</h2>
            <p className="text-xs text-muted-foreground">Powered by Claude · Indian & Australian markets specialist</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          Ask me anything about your portfolio — fund recommendations, goal analysis, tax optimisation,
          or a complete financial health check. I analyse your real portfolio data to give specific, actionable advice.
        </p>
      </div>

      {/* Quick questions */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-3">Quick questions</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => askQuestion(q)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted hover:border-primary/50 transition-colors disabled:opacity-50 text-left"
            >
              {q.length > 60 ? q.slice(0, 58) + '…' : q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex gap-3">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); askQuestion(question) } }}
            placeholder="Ask about your portfolio, investment strategy, goals..."
            rows={3}
            className="flex-1 bg-transparent text-sm resize-none focus:outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={() => askQuestion(question)}
            disabled={loading || !question.trim()}
            className="self-end px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Ask
          </button>
        </div>
      </div>

      {/* Streaming response */}
      {(loading || response) && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI Analysis</span>
            {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />}
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {response.split('\n').map((line, i) => {
              if (line.startsWith('## ')) return <h3 key={i} className="font-bold text-base mt-4 mb-2">{line.slice(3)}</h3>
              if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
              if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 text-sm">{line.slice(2)}</li>
              if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold text-sm">{line.slice(2, -2)}</p>
              if (line.trim() === '') return <br key={i} />
              return <p key={i} className="text-sm leading-relaxed">{line}</p>
            })}
            {loading && <span className="inline-block w-1 h-4 bg-primary animate-pulse ml-0.5 rounded" />}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">Previous questions</p>
          <div className="space-y-3">
            {history.slice(1).map((item, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium text-primary">{item.q}</p>
                  <button
                    onClick={() => { setResponse(item.a); setQuestion('') }}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{item.a.slice(0, 200)}…</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
