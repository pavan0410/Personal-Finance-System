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

const TYPE_STYLES = {
  income:   'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  expense:  'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  transfer: 'bg-secondary text-secondary-foreground',
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
      <div className="max-w-lg mx-auto">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
            dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/40'
          }`}
        >
          <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <p className="font-semibold mb-1">Drop your CSV here</p>
          <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
          <div className="flex justify-center gap-3">
            {['CommBank', 'UBank'].map(b => (
              <span key={b} className="text-xs px-3 py-1 rounded-full border border-border text-muted-foreground">{b}</span>
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
          <div className="mt-4 flex items-center gap-2 text-sm text-red-500 bg-red-500/10 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}

        <div className="mt-6 rounded-xl border border-border bg-card p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">How to export</p>
          <div className="space-y-2 text-sm">
            <div className="flex gap-3">
              <span className="font-medium w-24 shrink-0">CommBank</span>
              <span className="text-muted-foreground">NetBank → Accounts → select account → Export icon → CSV</span>
            </div>
            <div className="flex gap-3">
              <span className="font-medium w-24 shrink-0">UBank</span>
              <span className="text-muted-foreground">App or website → Accounts → Transactions → Download</span>
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
        <div className="h-16 w-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">Import complete</h2>
        <p className="text-muted-foreground mb-6">
          <span className="font-semibold text-foreground">{result.inserted}</span> transactions imported
          {result.duplicates > 0 && <>, <span className="font-semibold text-foreground">{result.duplicates}</span> duplicates skipped</>}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setStep('upload'); setRows([]); setBank(''); setResult(null) }}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
          >
            Import another file
          </button>
          <button
            onClick={() => router.push('/transactions')}
            className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
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
          <button onClick={() => { setStep('upload'); setRows([]) }} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold capitalize">{bank} CSV</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                {activeRows.length} of {rows.length} selected
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Review and edit categories before importing</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {accounts.length > 0 && (
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none"
            >
              <option value="">No account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
          <button
            onClick={handleImport}
            disabled={loading || activeRows.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Import {activeRows.length} transactions
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {/* Preview table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider bg-muted/40">
                <th className="px-4 py-3 w-8"></th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Description</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-right px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-border transition-colors ${
                    row.skip ? 'opacity-40' : 'hover:bg-muted/30'
                  }`}
                >
                  {/* Skip toggle */}
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => updateRow(row.id, { skip: !row.skip })}
                      className="text-muted-foreground hover:text-foreground"
                      title={row.skip ? 'Include' : 'Skip'}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap text-xs">
                    {row.date}
                  </td>

                  {/* Description */}
                  <td className="px-4 py-2.5 max-w-[280px]">
                    <p className="truncate font-medium">{row.description}</p>
                  </td>

                  {/* Category — editable */}
                  <td className="px-4 py-2.5">
                    <div className="relative inline-block">
                      <select
                        value={row.category}
                        onChange={(e) => recategorise(row.id, e.target.value)}
                        disabled={row.skip}
                        className="appearance-none text-xs pl-2.5 pr-6 py-1 rounded-full border border-border bg-secondary text-secondary-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:cursor-default"
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_STYLES[row.type]}`}>
                      {row.type}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className={`text-right px-4 py-2.5 font-medium tabular-nums ${
                    row.amount >= 0 ? 'text-emerald-500' : 'text-red-500'
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
