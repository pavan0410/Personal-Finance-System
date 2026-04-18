'use client'

import { useState } from 'react'
import { Plus, Upload, Search, ArrowUpDown } from 'lucide-react'
import { formatAUD, gainLossColor } from '@/lib/utils'
import { AddTransactionDialog } from './AddTransactionDialog'
import { useRouter } from 'next/navigation'
import type { Transaction, Account } from '@/types'

const CATEGORIES = ['Food', 'Transport', 'Utilities', 'Healthcare', 'Entertainment', 'Shopping', 'Rent', 'Salary', 'Investment', 'Transfer', 'Other']

interface Props {
  transactions: Transaction[]
  accounts: Pick<Account, 'id' | 'name' | 'currency'>[]
  userId: string
}

export function TransactionsClient({ transactions, accounts, userId }: Props) {
  const router = useRouter()
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all')
  const [categoryFilter, setCategoryFilter] = useState('')

  const filtered = transactions.filter((t) => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false
    if (categoryFilter && t.category !== categoryFilter) return false
    if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Income</p>
          <p className="text-xl font-bold text-emerald-500">{formatAUD(totalIncome)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Expenses</p>
          <p className="text-xl font-bold text-red-500">{formatAUD(totalExpense)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Net</p>
          <p className={`text-xl font-bold ${gainLossColor(totalIncome - totalExpense)}`}>
            {formatAUD(totalIncome - totalExpense)}
          </p>
        </div>
      </div>

      {/* Filters + Actions */}
      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions..."
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none"
          >
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="transfer">Transfer</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none"
          >
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => router.push('/transactions/import')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
            >
              <Upload className="h-3.5 w-3.5" /> Import CSV
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground text-sm mb-3">No transactions found</p>
              <button onClick={() => setShowAdd(true)} className="text-sm text-primary hover:underline">
                Add your first transaction →
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="text-left px-6 py-3">Date</th>
                  <th className="text-left px-4 py-3">Description</th>
                  <th className="text-left px-4 py-3">Category</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-right px-6 py-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b border-border hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-3 text-muted-foreground whitespace-nowrap">{t.date}</td>
                    <td className="px-4 py-3 font-medium">{t.description}</td>
                    <td className="px-4 py-3">
                      {t.category && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                          {t.category}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        t.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                        t.type === 'expense' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                        'bg-secondary text-secondary-foreground'
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className={`text-right px-6 py-3 font-medium ${gainLossColor(t.type === 'expense' ? -1 : 1)}`}>
                      {t.type === 'expense' ? '-' : '+'}{formatAUD(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAdd && (
        <AddTransactionDialog
          accounts={accounts}
          userId={userId}
          onClose={() => { setShowAdd(false); router.refresh() }}
        />
      )}
    </div>
  )
}
