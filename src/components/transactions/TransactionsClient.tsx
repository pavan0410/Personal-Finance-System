'use client'

import { useState } from 'react'
import { Plus, Upload, Search } from 'lucide-react'
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

const selectStyle = {
  height: '36px',
  padding: '0 12px',
  borderRadius: '10px',
  background: 'rgba(99,102,241,0.08)',
  border: '1px solid rgba(99,102,241,0.2)',
  color: 'rgba(220,225,255,0.85)',
  fontSize: '13px',
  outline: 'none',
  cursor: 'pointer',
  appearance: 'none' as const,
  WebkitAppearance: 'none' as const,
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
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Income', value: formatAUD(totalIncome), color: '#34d399' },
          { label: 'Expenses', value: formatAUD(totalExpense), color: '#f87171' },
          { label: 'Net', value: formatAUD(totalIncome - totalExpense), color: totalIncome >= totalExpense ? '#34d399' : '#f87171' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-5"
            style={{
              background: 'rgba(13,16,40,0.8)',
              border: '1px solid rgba(99,102,241,0.15)',
              backdropFilter: 'blur(12px)',
            }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'rgba(161,174,255,0.5)' }}>{label}</p>
            <p className="text-xl font-black" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters + Table */}
      <div className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(13,16,40,0.8)',
          border: '1px solid rgba(99,102,241,0.15)',
          backdropFilter: 'blur(12px)',
        }}>
        {/* Toolbar */}
        <div className="p-4 flex items-center gap-3 flex-wrap"
          style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
              style={{ color: 'rgba(161,174,255,0.4)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions..."
              className="w-full h-9 pl-9 pr-3 text-sm"
              style={{
                ...selectStyle,
                paddingLeft: '36px',
              }}
            />
          </div>

          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            style={selectStyle}>
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="transfer">Transfer</option>
          </select>

          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            style={selectStyle}>
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => router.push('/transactions/import')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm btn-ghost transition-all">
              <Upload className="h-3.5 w-3.5" /> Import CSV
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold btn-gradient">
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm mb-3" style={{ color: 'rgba(161,174,255,0.4)' }}>No transactions found</p>
              <button onClick={() => setShowAdd(true)}
                className="text-sm font-semibold transition-colors"
                style={{ color: '#818cf8' }}>
                Add your first transaction →
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
                  {['Date', 'Description', 'Category', 'Type', 'Amount'].map((h, i) => (
                    <th key={h}
                      className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wider ${i === 4 ? 'text-right' : 'text-left'}`}
                      style={{ color: 'rgba(161,174,255,0.4)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid rgba(99,102,241,0.08)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.05)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                    <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: 'rgba(161,174,255,0.5)' }}>
                      {t.date}
                    </td>
                    <td className="px-5 py-3.5 font-medium" style={{ color: 'rgba(220,225,255,0.85)' }}>
                      {t.description}
                    </td>
                    <td className="px-5 py-3.5">
                      {t.category && (
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{
                            background: 'rgba(99,102,241,0.12)',
                            color: 'rgba(165,180,252,0.8)',
                            border: '1px solid rgba(99,102,241,0.2)',
                          }}>
                          {t.category}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        t.type === 'income'   ? 'badge-income'   :
                        t.type === 'expense'  ? 'badge-expense'  :
                        'badge-transfer'
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className={`text-right px-5 py-3.5 font-bold tabular-nums ${
                      t.type === 'expense' ? 'text-negative' : 'text-positive'
                    }`}>
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
