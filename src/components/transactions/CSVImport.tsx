'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, CheckCircle2, AlertCircle, ChevronDown, Loader2, ArrowLeft, X } from 'lucide-react'
import { parseCSV, categorise, CATEGORIES, type ParsedTransaction } from '@/lib/csv-parsers'
import { useRouter } from 'next/navigation'
import type { Account } from '@/types'

interface Row extends ParsedTransaction {
  id: number
  skip: boolean
}

interface Props {
  accounts: Pick<Account, 'id' | 'name'>[]
}

const TYPE_INLINE_STYLES: Record<string, { background: string; color: string }> = {
  income:   { background: 'rgba(16,185,129,0.12)',  color: '#6ee7b7' },
  expense:  { background: 'rgba(239,68,68,0.12)',   color: '#fca5a5' },
  transfer: { background: 'rgba(99,102,241,0.12)',  color: '#a5b4fc' },
}

const CARD_STYLE = {
  background: 'rgba(13,16,40,0.8)',
  border: '1px solid rgba(99,102,241,0.15)',
  backdropFilter: 'blur(12px)',
}

const LABEL_COLOR = { color: 'rgba(161,174,255,0.5)' }
const TEXT_COLOR = { color: 'rgba(220,225,255,0.9)' }

export function CSVImport({ accounts }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [bank, setBank] = useState<string>('')
  const [rows, setRows] = useState<Row[]>([])
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id ?? '')
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [result, setResult] = useState<{ inserted: number; duplicates: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function processFile(file: File) {
    if (!file.name.endsWith('.csv')) { setError('Please upload a .csv file'); return }
    setError('')
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const { bank: detected, transactions } = parseCSV(text)
      if (!transactions.length) { setError('No transactions found — check the file format'); return }
      setBank(detected)
      setRows(transactions.map((t, i) => ({ ...t, id: i, skip: false })))
      setStep('preview')
    }
    reader.readAsText(file)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [])

  function updateRow(id: number, patch: Partial<Row>) {
    setRows(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r))
  }

  function recategorise(id: number, category: string) {
    const type = category === 'Transfer' ? 'transfer'
      : rows.find(r => r.id === id)!.amount >= 0 ? 'income' : 'expense'
    updateRow(id, { category, type })
  }

  const activeRows = rows.filter(r => !r.skip)

  async function handleImport() {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/import/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: activeRows.map(r => ({ ...r, account_id: accountId || null })),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Import failed'); return }
      setResult(data)
      setStep('done')
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  // ── Upload step ─────────────────────────────────────────────────────────────
  if (step === 'upload') {
    return (
      <div className="max-w-lg mx-auto">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all"
          style={dragging ? {
            borderColor: '#6366f1',
            background: 'rgba(99,102,241,0.08)',
            boxShadow: '0 0 0 1px rgba(99,102,241,0.3)',
          } : {
            borderColor: 'rgba(99,102,241,0.2)',
            background: 'rgba(13,16,40,0.5)',
          }}
        >
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: dragging ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(99,102,241,0.12)' }}>
            <Upload className="h-8 w-8" style={{ color: dragging ? 'white' : 'rgba(161,174,255,0.5)' }} />
          </div>
          <p className="font-semibold mb-1" style={TEXT_COLOR}>Drop your CSV here</p>
          <p className="text-sm mb-4" style={LABEL_COLOR}>or click to browse</p>
          <div className="flex justify-center gap-3">
            {['CommBank', 'UBank'].map(b => (
              <span key={b} className="text-xs px-3 py-1 rounded-full"
                style={{ border: '1px solid rgba(99,102,241,0.2)', color: 'rgba(161,174,255,0.6)' }}>
                {b}
              </span>
            ))}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
          />
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-sm rounded-lg p-3"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}

        <div className="mt-6 rounded-2xl p-4 space-y-2" style={CARD_STYLE}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={LABEL_COLOR}>How to export</p>
          <div className="space-y-2 text-sm">
            <div className="flex gap-3">
              <span className="font-medium w-24 shrink-0" style={TEXT_COLOR}>CommBank</span>
              <span style={LABEL_COLOR}>NetBank → Accounts → select account → Export icon → CSV</span>
            </div>
            <div className="flex gap-3">
              <span className="font-medium w-24 shrink-0" style={TEXT_COLOR}>UBank</span>
              <span style={LABEL_COLOR}>App or website → Accounts → Transactions → Download</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Done step ───────────────────────────────────────────────────────────────
  if (step === 'done' && result) {
    return (
      <div className="max-w-md mx-auto text-center py-8">
        <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}>
          <CheckCircle2 className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-xl font-bold mb-2" style={TEXT_COLOR}>Import complete</h2>
        <p className="mb-6" style={LABEL_COLOR}>
          <span className="font-semibold" style={TEXT_COLOR}>{result.inserted}</span> transactions imported
          {result.duplicates > 0 && <>, <span className="font-semibold" style={TEXT_COLOR}>{result.duplicates}</span> duplicates skipped</>}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setStep('upload'); setRows([]); setBank(''); setResult(null) }}
            className="btn-ghost px-4 py-2 text-sm rounded-lg"
          >
            Import another file
          </button>
          <button
            onClick={() => router.push('/transactions')}
            className="btn-gradient px-4 py-2 text-sm rounded-lg text-white"
          >
            View transactions
          </button>
        </div>
      </div>
    )
  }

  // ── Preview step ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => { setStep('upload'); setRows([]) }} style={{ color: 'rgba(161,174,255,0.5)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(220,225,255,0.9)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(161,174,255,0.5)' }}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" style={{ color: 'rgba(161,174,255,0.5)' }} />
              <span className="font-semibold capitalize" style={TEXT_COLOR}>{bank} CSV</span>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                {activeRows.length} of {rows.length} selected
              </span>
            </div>
            <p className="text-xs mt-0.5" style={LABEL_COLOR}>Review and edit categories before importing</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {accounts.length > 0 && (
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="h-9 px-3 rounded-lg text-sm input-dark"
            >
              <option value="">No account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
          <button
            onClick={handleImport}
            disabled={loading || activeRows.length === 0}
            className="btn-gradient flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-white disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Import {activeRows.length} transactions
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm rounded-lg p-3"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {/* Preview table */}
      <div className="rounded-2xl overflow-hidden" style={CARD_STYLE}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.12)', background: 'rgba(99,102,241,0.04)' }}>
                <th className="px-4 py-3 w-8"></th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest" style={LABEL_COLOR}>Date</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest" style={LABEL_COLOR}>Description</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest" style={LABEL_COLOR}>Category</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest" style={LABEL_COLOR}>Type</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold uppercase tracking-widest" style={LABEL_COLOR}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors"
                  style={{
                    borderBottom: '1px solid rgba(99,102,241,0.08)',
                    opacity: row.skip ? 0.4 : 1,
                  }}
                  onMouseEnter={e => { if (!row.skip) (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.05)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
                >
                  {/* Skip toggle */}
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => updateRow(row.id, { skip: !row.skip })}
                      style={{ color: 'rgba(161,174,255,0.4)' }}
                      title={row.skip ? 'Include' : 'Skip'}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(239,68,68,0.8)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(161,174,255,0.4)' }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-2.5 whitespace-nowrap text-xs" style={LABEL_COLOR}>
                    {row.date}
                  </td>

                  {/* Description */}
                  <td className="px-4 py-2.5 max-w-[280px]">
                    <p className="truncate font-medium" style={TEXT_COLOR}>{row.description}</p>
                  </td>

                  {/* Category — editable */}
                  <td className="px-4 py-2.5">
                    <div className="relative inline-block">
                      <select
                        value={row.category}
                        onChange={(e) => recategorise(row.id, e.target.value)}
                        disabled={row.skip}
                        className="appearance-none text-xs pl-2.5 pr-6 py-1 rounded-full cursor-pointer focus:outline-none disabled:cursor-default input-dark"
                        style={{ border: '1px solid rgba(99,102,241,0.2)' }}
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: 'rgba(161,174,255,0.4)' }} />
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={TYPE_INLINE_STYLES[row.type] ?? TYPE_INLINE_STYLES.expense}>
                      {row.type}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className={`text-right px-4 py-2.5 font-medium tabular-nums ${
                    row.amount >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {row.amount >= 0 ? '+' : ''}${Math.abs(row.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
