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

const TYPE_BADGE = {
  income:   { background: 'rgba(16,185,129,0.15)', color: '#6ee7b7' },
  expense:  { background: 'rgba(239,68,68,0.15)',  color: '#fca5a5' },
  transfer: { background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' },
}

const cardStyle = {
  background: 'rgba(13,16,40,0.8)',
  border: '1px solid rgba(99,102,241,0.15)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
}

const selectStyle = {
  background: 'rgba(99,102,241,0.08)',
  border: '1px solid rgba(99,102,241,0.2)',
  color: 'rgba(220,225,255,0.85)',
  borderRadius: '10px',
  outline: 'none',
  fontSize: '13px',
  appearance: 'none' as const,
  WebkitAppearance: 'none' as const,
}

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
      <div className="max-w-lg mx-auto space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className="rounded-2xl p-12 text-center cursor-pointer transition-all duration-200"
          style={dragging ? {
            border: '2px dashed #6366f1',
            background: 'rgba(99,102,241,0.08)',
            boxShadow: '0 0 0 4px rgba(99,102,241,0.1)',
          } : {
            border: '2px dashed rgba(99,102,241,0.25)',
            background: 'rgba(13,16,40,0.6)',
          }}
          onMouseEnter={e => { if (!dragging) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.45)' }}
          onMouseLeave={e => { if (!dragging) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.25)' }}
        >
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
              border: '1px solid rgba(99,102,241,0.3)',
            }}>
            <Upload className="h-6 w-6" style={{ color: '#818cf8' }} />
          </div>
          <p className="font-bold text-white mb-1">Drop your CSV here</p>
          <p className="text-sm mb-5" style={{ color: 'rgba(161,174,255,0.5)' }}>or click to browse</p>
          <div className="flex justify-center gap-2">
            {['CommBank', 'UBank'].map(b => (
              <span key={b}
                className="text-xs px-3 py-1 rounded-full font-medium"
                style={{
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  color: 'rgba(165,180,252,0.7)',
                }}>
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
          <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#fca5a5',
            }}>
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}

        {/* How to export */}
        <div className="rounded-2xl p-5 space-y-3"
          style={{ ...cardStyle }}>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-3"
            style={{ color: 'rgba(161,174,255,0.4)' }}>How to export</p>
          <div className="space-y-3 text-sm">
            {[
              { bank: 'CommBank', steps: 'NetBank → Accounts → select account → Export icon → CSV' },
              { bank: 'UBank', steps: 'App or website → Accounts → Transactions → Download' },
            ].map(({ bank, steps }) => (
              <div key={bank} className="flex gap-3">
                <span className="font-semibold w-24 shrink-0" style={{ color: '#a5b4fc' }}>{bank}</span>
                <span style={{ color: 'rgba(161,174,255,0.5)' }}>{steps}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Done step ───────────────────────────────────────────────────────────────
  if (step === 'done' && result) {
    return (
      <div className="max-w-md mx-auto text-center py-8">
        <div className="h-20 w-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.2))',
            border: '1px solid rgba(16,185,129,0.3)',
          }}>
          <CheckCircle2 className="h-9 w-9" style={{ color: '#34d399' }} />
        </div>
        <h2 className="text-2xl font-black mb-2 gradient-text">Import complete</h2>
        <p className="text-sm mb-8" style={{ color: 'rgba(161,174,255,0.5)' }}>
          <span className="font-bold text-white">{result.inserted}</span> transactions imported
          {result.duplicates > 0 && <>, <span className="font-bold text-white">{result.duplicates}</span> duplicates skipped</>}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setStep('upload'); setRows([]); setBank(''); setResult(null) }}
            className="px-5 py-2.5 text-sm rounded-xl font-semibold btn-ghost">
            Import another file
          </button>
          <button
            onClick={() => router.push('/transactions')}
            className="px-5 py-2.5 text-sm rounded-xl font-semibold btn-gradient">
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
          <button
            onClick={() => { setStep('upload'); setRows([]) }}
            className="p-2 rounded-lg transition-all"
            style={{ color: 'rgba(161,174,255,0.5)', background: 'rgba(99,102,241,0.08)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(165,180,252,1)'; (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.15)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(161,174,255,0.5)'; (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)' }}>
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <FileText className="h-4 w-4" style={{ color: '#818cf8' }} />
              <span className="font-bold capitalize text-white">{bank} CSV</span>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{
                  background: 'rgba(99,102,241,0.15)',
                  color: '#a5b4fc',
                  border: '1px solid rgba(99,102,241,0.2)',
                }}>
                {activeRows.length} of {rows.length} selected
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(161,174,255,0.4)' }}>Review and edit categories before importing</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {accounts.length > 0 && (
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="h-9 px-3"
              style={selectStyle}>
              <option value="">No account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
          <button
            onClick={handleImport}
            disabled={loading || activeRows.length === 0}
            className="flex items-center gap-2 px-5 py-2 text-sm rounded-xl font-semibold btn-gradient">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Import {activeRows.length} transactions
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#fca5a5',
          }}>
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {/* Preview table */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
                {['', 'Date', 'Description', 'Category', 'Type', 'Amount'].map((h, i) => (
                  <th key={i}
                    className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider ${h === 'Amount' ? 'text-right' : 'text-left'}`}
                    style={{ color: 'rgba(161,174,255,0.4)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors"
                  style={{
                    borderBottom: '1px solid rgba(99,102,241,0.08)',
                    opacity: row.skip ? 0.3 : 1,
                  }}
                  onMouseEnter={e => { if (!row.skip) (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.05)' }}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                >
                  {/* Skip toggle */}
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => updateRow(row.id, { skip: !row.skip })}
                      className="transition-colors"
                      style={{ color: row.skip ? 'rgba(99,102,241,0.4)' : 'rgba(161,174,255,0.3)' }}
                      title={row.skip ? 'Include' : 'Skip'}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#f87171'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = row.skip ? 'rgba(99,102,241,0.4)' : 'rgba(161,174,255,0.3)'}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-2.5 text-xs whitespace-nowrap"
                    style={{ color: 'rgba(161,174,255,0.5)' }}>
                    {row.date}
                  </td>

                  {/* Description */}
                  <td className="px-4 py-2.5 max-w-[260px]">
                    <p className="truncate font-medium" style={{ color: 'rgba(220,225,255,0.85)' }}>
                      {row.description}
                    </p>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-2.5">
                    <div className="relative inline-block">
                      <select
                        value={row.category}
                        onChange={(e) => recategorise(row.id, e.target.value)}
                        disabled={row.skip}
                        className="text-xs pl-2.5 pr-6 py-1 rounded-full cursor-pointer"
                        style={{
                          ...selectStyle,
                          fontSize: '11px',
                          paddingTop: '4px',
                          paddingBottom: '4px',
                          paddingLeft: '10px',
                          paddingRight: '24px',
                          borderRadius: '999px',
                        }}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none"
                        style={{ color: 'rgba(161,174,255,0.4)' }} />
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-2.5">
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                      style={TYPE_BADGE[row.type]}>
                      {row.type}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="text-right px-4 py-2.5 font-bold tabular-nums"
                    style={{ color: row.amount >= 0 ? '#34d399' : '#f87171' }}>
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
