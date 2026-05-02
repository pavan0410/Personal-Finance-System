'use client'

import { useState, useRef } from 'react'
import {
  Plus, Home, X, Loader2, TrendingUp, TrendingDown, DollarSign,
  Receipt, BarChart3, FileDown, Upload, Trash2, CheckCircle2, XCircle,
  ExternalLink, Edit2, CalendarDays,
} from 'lucide-react'
import { formatAUD } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { RealEstate, RealEstateExpense, RealEstateIncome } from '@/types'

// ── ATO expense categories ────────────────────────────────────────────────────
const ATO_CATS: { cat: string; deduct: string; note: string }[] = [
  { cat: 'Interest on Loan',           deduct: 'Fully deductible',         note: 'Deductible while property available for rent' },
  { cat: 'Council Rates',              deduct: 'Fully deductible',         note: 'Pro-rata from settlement date' },
  { cat: 'Water Rates',                deduct: 'Fully deductible',         note: 'Pro-rata from settlement date' },
  { cat: 'Landlord Insurance',         deduct: 'Fully deductible',         note: 'Deductible when property rented/available' },
  { cat: 'Repairs & Maintenance',      deduct: 'Fully deductible',         note: 'Must be repair not capital improvement' },
  { cat: 'Property Management Fee',    deduct: 'Fully deductible',         note: 'Deductible when tenanted' },
  { cat: 'Accounting / Tax Agent',     deduct: 'Fully deductible',         note: 'Tax return preparation costs' },
  { cat: 'Quantity Surveyor Report',   deduct: 'Fully deductible',         note: 'Deductible in year incurred' },
  { cat: 'Advertising for Tenants',    deduct: 'Fully deductible',         note: 'Deductible when incurred' },
  { cat: 'Pest Control',               deduct: 'Fully deductible',         note: 'Once tenanted' },
  { cat: 'Cleaning',                   deduct: 'Fully deductible',         note: 'Between tenancies or routine' },
  { cat: 'Garden / Lawn Maintenance',  deduct: 'Fully deductible',         note: 'Ongoing maintenance' },
  { cat: 'Sundry / Misc',              deduct: 'Fully deductible',         note: 'Verify with accountant' },
  { cat: 'Depreciation (Div 43)',      deduct: 'Depreciation (non-cash)',  note: 'Building write-off from QS report' },
  { cat: 'Depreciation (Div 40)',      deduct: 'Depreciation (non-cash)',  note: 'Plant & equipment from QS report' },
  { cat: 'Conveyancing / Legal',       deduct: 'CGT cost base',            note: 'Added to cost base, reduces CGT on sale' },
  { cat: 'Stamp Duty',                 deduct: 'CGT cost base',            note: 'Added to cost base' },
  { cat: 'Building & Pest Inspection', deduct: 'CGT cost base',            note: 'Pre-purchase — added to cost base' },
  { cat: 'Loan Establishment Fee',     deduct: 'CGT cost base',            note: 'Added to cost base' },
  { cat: 'Capital Improvement',        deduct: 'CGT cost base',            note: 'Not immediately deductible' },
  { cat: 'Principal Repayment',        deduct: 'Not deductible',           note: 'Only interest is deductible' },
  { cat: 'Rental Income',              deduct: 'Rental income',            note: 'Assessable income' },
]

// ── FY helpers ────────────────────────────────────────────────────────────────
function recordFY(dateStr: string): string {
  const d = new Date(dateStr)
  const fyEnd = d.getMonth() >= 6 ? d.getFullYear() + 1 : d.getFullYear()
  return `FY${fyEnd}`
}
function currentFY(): string { return recordFY(new Date().toISOString()) }
function fyLabel(fy: string): string {
  const yr = parseInt(fy.replace('FY', ''))
  return `${fy}  (Jul ${yr - 1} – Jun ${yr})`
}

// ── Cash flow calculator ──────────────────────────────────────────────────────
interface CFResult {
  status: 'pre-settlement' | 'no-emi' | 'active'
  hasSettled: boolean
  daysTillSettlement: number
  isPreTenancy: boolean
  paymentCount: number
  grossRent: number
  estimatedRent: number
  totalInterest: number
  mgmtFee: number
  councilRates: number
  waterRates: number
  insurance: number
  repairs: number
  accounting: number
  div43: number
  div40: number
  totalDeductions: number
  netRental: number
  taxSaving: number
  cashFlow: number
  perWeek: number
  grossYield: number
  loanBalance: number
  estimatedValue: number
  equity: number
}

function calcCF(
  p: RealEstate,
  expenses: RealEstateExpense[],
  income: RealEstateIncome[],
  fy: string
): CFResult {
  const now       = new Date()
  const fyYear    = parseInt(fy.replace('FY', ''))
  const fyStart   = new Date(fyYear - 1, 6, 1)
  const fyEnd     = new Date(fyYear, 5, 30, 23, 59, 59)
  const periodEnd = now < fyEnd ? now : fyEnd

  const settlementDate = p.settlement_date ? new Date(p.settlement_date) : null
  const emiStartDate   = p.emi_start_date  ? new Date(p.emi_start_date)  : null
  const tenancyDate    = p.tenancy_start   ? new Date(p.tenancy_start)   : null

  const hasSettled         = !!settlementDate && settlementDate <= now
  const daysTillSettlement = settlementDate ? Math.ceil((settlementDate.getTime() - now.getTime()) / 86400000) : 0

  // P&I amortised loan balance
  const loanOrig   = p.loan_amount ?? p.loan_outstanding ?? 0
  const rMonthly   = (p.loan_rate ?? 0) / 100 / 12
  const nPayments  = (p.loan_term_years ?? 30) * 12
  const monthsPaid = settlementDate && hasSettled
    ? Math.max(0, Math.floor((now.getTime() - settlementDate.getTime()) / (365.25 / 12 * 86400000)))
    : 0
  const loanBalance = (hasSettled && monthsPaid > 0 && rMonthly > 0 && loanOrig > 0)
    ? loanOrig * (Math.pow(1 + rMonthly, nPayments) - Math.pow(1 + rMonthly, monthsPaid)) / (Math.pow(1 + rMonthly, nPayments) - 1)
    : loanOrig

  const yearsOwned     = settlementDate && hasSettled ? (now.getTime() - settlementDate.getTime()) / (365.25 * 86400000) : 0
  const estimatedValue = (p.purchase_price ?? 0) * Math.pow(1 + (p.growth_rate ?? 0.04), Math.max(0, yearsOwned))
  const grossYield     = (p.weekly_rent ?? 0) > 0 && (p.purchase_price ?? 0) > 0
    ? ((p.weekly_rent ?? 0) * 52) / (p.purchase_price ?? 1) * 100 : 0
  const equity         = p.deposit_paid ?? 0

  const base: Omit<CFResult, 'status'> = {
    hasSettled, daysTillSettlement, isPreTenancy: true,
    paymentCount: 0, grossRent: 0, estimatedRent: 0, totalInterest: 0,
    mgmtFee: 0, councilRates: 0, waterRates: 0, insurance: 0,
    repairs: 0, accounting: 0, div43: 0, div40: 0,
    totalDeductions: 0, netRental: 0, taxSaving: 0, cashFlow: 0, perWeek: 0,
    grossYield, loanBalance, estimatedValue, equity,
  }

  if (!settlementDate || settlementDate > periodEnd) return { ...base, status: 'pre-settlement' }
  if (!emiStartDate)                                  return { ...base, status: 'no-emi', hasSettled: true }

  // Count loan repayment periods in FY
  const freqDays = p.payment_freq === 'Weekly' ? 7 : p.payment_freq === 'Fortnightly' ? 14 : 30.44
  let paymentCount = 0
  let d = new Date(emiStartDate)
  while (d <= periodEnd) {
    if (d >= fyStart && d >= settlementDate) paymentCount++
    d = new Date(d.getTime() + freqDays * 86400000)
  }

  // Interest
  const monthlyInt    = loanBalance * (p.loan_rate ?? 0) / 100 / 12
  const pmtsPerMonth  = freqDays < 14 ? 4.33 : freqDays < 20 ? 2.17 : 1
  const totalInterest = (monthlyInt / pmtsPerMonth) * paymentCount

  // Rental income
  const isPreTenancy = !tenancyDate || tenancyDate > now
  const rentStart    = tenancyDate ? (tenancyDate >= fyStart ? tenancyDate : fyStart) : null
  let rentPayments = 0
  if (rentStart) {
    let rd = new Date(rentStart)
    while (rd <= periodEnd) { if (rd >= fyStart) rentPayments++; rd = new Date(rd.getTime() + 7 * 86400000) }
  }
  const estimatedRent = rentPayments * (p.weekly_rent ?? 0)

  // Pro-rate annual costs
  const fyDays     = (fyEnd.getTime() - fyStart.getTime()) / 86400000
  const activeFrom = settlementDate > fyStart ? settlementDate : fyStart
  const activeDays = Math.max(0, Math.min((periodEnd.getTime() - activeFrom.getTime()) / 86400000, fyDays))
  const frac       = activeDays / fyDays

  const estMgmt       = isPreTenancy ? 0 : estimatedRent * (p.property_mgmt_pct ?? 0.066)
  const estCouncil    = (p.council_rates      ?? 0) * frac
  const estWater      = (p.water_rates        ?? 0) * frac
  const estInsurance  = (p.landlord_insurance ?? 0) * frac
  const estRepairs    = (p.repairs_maintenance ?? 0) * frac
  const estAccounting = (p.accounting         ?? 0) * frac
  const div43         = (p.div43_annual        ?? 0) * frac
  const div40         = (p.div40_annual        ?? 0) * frac

  // Actual logged > estimated
  const fyExp = expenses.filter(e => e.property_id === p.id && recordFY(e.date) === fy)
  const logged = (cat: string) => fyExp.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0)
  const fyInc  = income.filter(i => i.property_id === p.id && recordFY(i.date) === fy).reduce((s, i) => s + i.amount, 0)

  const grossRent    = fyInc > 0 ? fyInc : estimatedRent
  const mgmtFee      = logged('Property Management Fee') || estMgmt
  const councilRates = logged('Council Rates')           || estCouncil
  const waterRates   = logged('Water Rates')             || estWater
  const insurance    = logged('Landlord Insurance')      || estInsurance
  const repairs      = logged('Repairs & Maintenance')   || estRepairs
  const accounting   = logged('Accounting / Tax Agent')  || estAccounting

  const totalDeductions = totalInterest + mgmtFee + councilRates + waterRates + insurance + repairs + accounting + div43 + div40
  const netRental       = grossRent - totalDeductions

  const o1Rate    = ((p.owner1_tax_rate ?? 0.37) + (p.medicare_levy ?? 0.02)) * (p.owner1_share ?? 0.5)
  const o2Rate    = ((p.owner2_tax_rate ?? 0.37) + (p.medicare_levy ?? 0.02)) * (p.owner2_share ?? 0.5)
  const taxSaving = netRental < 0 ? Math.abs(netRental) * (o1Rate + o2Rate) : 0

  const cashExpenses = totalInterest + mgmtFee + councilRates + waterRates + insurance + repairs + accounting
  const cashFlow     = grossRent - cashExpenses + taxSaving
  const perWeek      = activeDays > 0 ? cashFlow / (activeDays / 7) : 0

  return {
    status: 'active', hasSettled, daysTillSettlement, isPreTenancy,
    paymentCount, grossRent, estimatedRent, totalInterest,
    mgmtFee, councilRates, waterRates, insurance, repairs, accounting,
    div43, div40, totalDeductions, netRental, taxSaving, cashFlow, perWeek,
    grossYield, loanBalance, estimatedValue, equity,
  }
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const CARD  = { background: 'rgba(13,16,40,0.8)', border: '1px solid rgba(99,102,241,0.15)', backdropFilter: 'blur(12px)' } as const
const MODAL = { background: 'rgba(10,12,30,0.95)', border: '1px solid rgba(99,102,241,0.25)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' } as const
const LC    = { color: 'rgba(161,174,255,0.5)' } as const
const TC    = { color: 'rgba(220,225,255,0.9)' } as const

// ── Default form values ───────────────────────────────────────────────────────
const PROP_DEFAULTS = {
  name: '', address: '', property_type: 'residential' as 'residential' | 'commercial' | 'land',
  country: 'AU', currency: 'AUD', year_built: '',
  purchase_price: '', purchase_date: '', settlement_date: '', deposit_paid: '',
  loan_amount: '', loan_outstanding: '', loan_rate: '6.89', loan_type: 'P&I',
  loan_term_years: '30', rate_type: 'Variable', lender: '',
  emi_start_date: '', payment_freq: 'Monthly',
  current_valuation: '', valuation_date: new Date().toISOString().split('T')[0], growth_rate: '4',
  tenancy_start: '', weekly_rent: '', vacancy_weeks: '2', property_mgmt_pct: '6.6',
  council_rates: '', water_rates: '', landlord_insurance: '', repairs_maintenance: '',
  accounting: '', quantity_surveyor: '', sundry: '', div43_annual: '', div40_annual: '',
  owner1_name: '', owner1_salary: '', owner1_share: '50', owner1_tax_rate: '37',
  owner2_name: '', owner2_salary: '', owner2_share: '50', owner2_tax_rate: '37',
  medicare_levy: '2', property_status: 'Pre-settlement',
}
type PropForm = typeof PROP_DEFAULTS

// ══════════════════════════════════════════════════════════════════════════════
// MODULE-LEVEL SUB-COMPONENTS (hoisted to avoid focus loss on re-render)
// ══════════════════════════════════════════════════════════════════════════════

// ── Filter bar ────────────────────────────────────────────────────────────────
interface FilterBarProps {
  selectedFY: string
  setSelectedFY: (v: string) => void
  allFYs: string[]
  filterPropId: string
  setFilterPropId: (v: string) => void
  properties: RealEstate[]
}
function FilterBar({ selectedFY, setSelectedFY, allFYs, filterPropId, setFilterPropId, properties }: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select value={selectedFY} onChange={e => setSelectedFY(e.target.value)} className="h-8 px-3 rounded-lg text-xs input-dark">
        {allFYs.map(fy => <option key={fy} value={fy}>{fyLabel(fy)}</option>)}
      </select>
      {properties.length > 1 && (
        <select value={filterPropId} onChange={e => setFilterPropId(e.target.value)} className="h-8 px-3 rounded-lg text-xs input-dark">
          <option value="">All properties</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      )}
    </div>
  )
}

// ── Cash flow table ───────────────────────────────────────────────────────────
interface CashFlowTableProps {
  p: RealEstate
  expenses: RealEstateExpense[]
  income: RealEstateIncome[]
  selectedFY: string
}
function CashFlowTable({ p, expenses, income, selectedFY }: CashFlowTableProps) {
  const cf = calcCF(p, expenses, income, selectedFY)

  if (cf.status === 'pre-settlement') {
    const days = cf.daysTillSettlement
    return (
      <div className="rounded-xl p-4 mt-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
            <CalendarDays className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-amber-400">
              {days > 0 ? `Settlement in ${days} days` : p.settlement_date ? 'Settlement today!' : 'No settlement date set'}
            </p>
            <p className="text-xs mt-0.5" style={LC}>
              {p.settlement_date ? `${p.settlement_date} — Cash flow activates after settlement` : 'Edit the property to add a settlement date'}
            </p>
          </div>
          {days > 0 && (
            <div className="ml-auto text-right">
              <p className="text-3xl font-black text-amber-400">{days}</p>
              <p className="text-[10px] text-amber-400/60">days to go</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (cf.status === 'no-emi') {
    return (
      <div className="rounded-xl p-4 mt-4" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
        <p className="text-sm font-semibold mb-1" style={TC}>Configure loan repayments</p>
        <p className="text-xs" style={LC}>Edit this property and add your <strong style={{ color: '#a5b4fc' }}>EMI start date</strong> and <strong style={{ color: '#a5b4fc' }}>payment frequency</strong> — the cash flow table will appear automatically.</p>
      </div>
    )
  }

  const rows = [
    { label: 'Gross Rental Income', val: cf.grossRent, green: true, note: cf.isPreTenancy ? 'pre-tenancy (no rent yet)' : cf.estimatedRent !== cf.grossRent ? 'from logged income' : `${Math.round(cf.grossRent / Math.max(p.weekly_rent ?? 1, 1))} weeks` },
    { label: `Interest (${cf.paymentCount} × ${(p.payment_freq ?? 'monthly').toLowerCase()})`, val: -cf.totalInterest, note: `from ${p.emi_start_date}` },
    ...(cf.mgmtFee > 0      ? [{ label: `Property Mgmt (${((p.property_mgmt_pct ?? 0.066)*100).toFixed(1)}%)`, val: -cf.mgmtFee }] : []),
    ...(cf.councilRates > 0 ? [{ label: 'Council Rates',          val: -cf.councilRates }] : []),
    ...(cf.waterRates > 0   ? [{ label: 'Water Rates',            val: -cf.waterRates }]   : []),
    ...(cf.insurance > 0    ? [{ label: 'Landlord Insurance',     val: -cf.insurance }]    : []),
    ...(cf.repairs > 0      ? [{ label: 'Repairs & Maintenance',  val: -cf.repairs }]      : []),
    ...(cf.accounting > 0   ? [{ label: 'Accounting',             val: -cf.accounting }]   : []),
    ...((cf.div43 + cf.div40) > 0 ? [{ label: 'Depreciation (Div 43 + 40)', val: -(cf.div43 + cf.div40), note: 'non-cash' }] : []),
  ] as { label: string; val: number; green?: boolean; note?: string }[]

  return (
    <div className="mt-4">
      {cf.isPreTenancy && (
        <div className="rounded-lg px-3 py-2 mb-3 text-xs flex items-center gap-2"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#fcd34d' }}>
          🏠 <strong>Pre-tenancy</strong> — {p.tenancy_start ? `Rent starts ${p.tenancy_start}` : 'Add tenancy start date to activate rental income'}
        </div>
      )}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(99,102,241,0.12)' }}>
        <div className="px-3 py-2 flex gap-4 text-[11px]" style={{ background: 'rgba(99,102,241,0.06)', borderBottom: '1px solid rgba(99,102,241,0.12)', color: 'rgba(161,174,255,0.5)' }}>
          <span>📅 EMI start: <strong style={TC}>{p.emi_start_date}</strong></span>
          <span>🔄 <strong style={TC}>{p.payment_freq ?? 'Monthly'}</strong></span>
          <span>📊 <strong style={TC}>{cf.paymentCount}</strong> payments in {selectedFY}</span>
        </div>
        <table className="w-full text-xs">
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(99,102,241,0.07)' }}>
                <td className="px-3 py-2" style={LC}>
                  {r.label}
                  {r.note && <span className="ml-1 text-[10px]" style={{ color: 'rgba(161,174,255,0.3)' }}>({r.note})</span>}
                </td>
                <td className={`px-3 py-2 text-right font-semibold tabular-nums ${r.val >= 0 ? 'text-emerald-400' : ''}`} style={r.val < 0 ? TC : {}}>
                  {r.val >= 0 ? '+' : '−'}${Math.abs(r.val).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </td>
              </tr>
            ))}
            <tr style={{ background: 'rgba(99,102,241,0.06)', borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
              <td className="px-3 py-2.5 font-bold text-xs" style={TC}>Net Rental Position</td>
              <td className={`px-3 py-2.5 text-right font-black tabular-nums text-xs ${cf.netRental >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {cf.netRental >= 0 ? '+' : '−'}${Math.abs(cf.netRental).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </td>
            </tr>
            {cf.taxSaving > 0 && (
              <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.07)' }}>
                <td className="px-3 py-2" style={{ fontSize: '11px', color: '#6ee7b7' }}>Tax Saving (negative gearing)</td>
                <td className="px-3 py-2 text-right font-semibold text-emerald-400 tabular-nums" style={{ fontSize: '11px' }}>
                  +${cf.taxSaving.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </td>
              </tr>
            )}
            <tr style={{ background: cf.cashFlow >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)' }}>
              <td className="px-3 py-2.5 font-bold text-xs" style={{ color: cf.cashFlow >= 0 ? '#6ee7b7' : '#fca5a5' }}>
                After-Tax Cash Flow
                <span className="ml-2 font-normal text-[10px]" style={LC}>
                  {cf.perWeek >= 0 ? '+' : ''}${Math.abs(cf.perWeek).toFixed(0)}/wk
                </span>
              </td>
              <td className="px-3 py-2.5 text-right font-black tabular-nums text-xs" style={{ color: cf.cashFlow >= 0 ? '#6ee7b7' : '#fca5a5' }}>
                {cf.cashFlow >= 0 ? '+' : '−'}${Math.abs(cf.cashFlow).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Property form ─────────────────────────────────────────────────────────────
interface PropertyFormProps {
  f: PropForm
  up: (k: string, v: string) => void
  title: string
  subtitle: string
  onSave: () => void
  onCancel: () => void
  saving: boolean
  error: string
}
function PropertyForm({ f, up, title, subtitle, onSave, onCancel, saving, error }: PropertyFormProps) {
  const row = (label: string, key: string, type = 'text', placeholder = '', opts?: string[]) => (
    <div key={key}>
      <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={LC}>{label}</label>
      {opts ? (
        <select value={(f as Record<string, string>)[key]} onChange={e => up(key, e.target.value)} className="w-full h-9 px-3 rounded-lg text-sm input-dark">
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={(f as Record<string, string>)[key]}
          onChange={e => up(key, e.target.value)}
          placeholder={placeholder}
          className="w-full h-9 px-3 rounded-lg text-sm input-dark"
        />
      )}
    </div>
  )
  const section = (label: string) => (
    <div className="col-span-full mt-2 mb-1" key={`section-${label}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#818cf8' }}>{label}</p>
      <div className="h-px mt-1" style={{ background: 'rgba(99,102,241,0.2)' }} />
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-2xl rounded-2xl max-h-[92vh] flex flex-col" style={MODAL}>
        <div className="px-6 py-5 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
          <div>
            <h2 className="font-bold text-lg" style={TC}>{title}</h2>
            <p className="text-xs mt-0.5" style={LC}>{subtitle}</p>
          </div>
          <button onClick={onCancel} className="h-8 w-8 rounded-lg flex items-center justify-center" style={LC}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {section('Property Details')}
            <div className="col-span-full">{row('Property Name *', 'name', 'text', 'e.g. Armidale IP')}</div>
            <div className="col-span-full">{row('Address (full)', 'address', 'text', '15 Dale Crescent, Armidale NSW 2350')}</div>
            {row('Type', 'property_type', 'text', '', ['residential', 'commercial', 'land'])}
            {row('Year Built', 'year_built', 'number', '2014')}
            {row('Country', 'country', 'text', '', ['AU', 'IN', 'US'])}
            {row('Status', 'property_status', 'text', '', ['Pre-settlement', 'Pre-tenancy', 'Tenanted', 'Vacant'])}

            {section('Purchase & Settlement')}
            {row('Purchase Price ($)', 'purchase_price', 'number', '570000')}
            {row('Purchase Date', 'purchase_date', 'date')}
            {row('Settlement Date', 'settlement_date', 'date')}
            {row('Deposit Paid at Settlement ($)', 'deposit_paid', 'number', '57000')}

            {section('Loan Details')}
            {row('Lender', 'lender', 'text', 'UBank')}
            {row('Original Loan Amount ($)', 'loan_amount', 'number', '513000')}
            {row('Current Loan Balance ($)', 'loan_outstanding', 'number', '513000')}
            {row('Interest Rate (% p.a.)', 'loan_rate', 'number', '6.89')}
            {row('Loan Term (years)', 'loan_term_years', 'number', '30')}
            {row('Loan Type', 'loan_type', 'text', '', ['P&I', 'Interest Only'])}
            {row('Rate Type', 'rate_type', 'text', '', ['Variable', 'Fixed'])}
            {row('EMI / Repayment Start Date', 'emi_start_date', 'date')}
            {row('Payment Frequency', 'payment_freq', 'text', '', ['Monthly', 'Fortnightly', 'Weekly'])}

            {section('Rental Details')}
            {row('Tenancy Start Date', 'tenancy_start', 'date')}
            {row('Weekly Rent ($)', 'weekly_rent', 'number', '550')}
            {row('Vacancy Allowance (weeks/yr)', 'vacancy_weeks', 'number', '2')}
            {row('Mgmt Fee (%)', 'property_mgmt_pct', 'number', '6.6')}
            {row('Current Valuation ($)', 'current_valuation', 'number', '')}
            {row('Valuation Date', 'valuation_date', 'date')}
            {row('Annual Growth Rate (%)', 'growth_rate', 'number', '4')}

            {section('Annual Operating Costs (auto cash flow)')}
            {row('Council Rates ($/yr)', 'council_rates', 'number', '2000')}
            {row('Water Rates ($/yr)', 'water_rates', 'number', '900')}
            {row('Landlord Insurance ($/yr)', 'landlord_insurance', 'number', '1500')}
            {row('Repairs & Maintenance ($/yr)', 'repairs_maintenance', 'number', '1500')}
            {row('Accounting ($/yr)', 'accounting', 'number', '500')}
            {row('Sundry / Misc ($/yr)', 'sundry', 'number', '300')}
            {row('Depreciation Div 43 ($/yr)', 'div43_annual', 'number', '5000')}
            {row('Depreciation Div 40 ($/yr)', 'div40_annual', 'number', '3000')}

            {section('Ownership & Tax (negative gearing)')}
            {row('Owner 1 Name', 'owner1_name', 'text', 'Pavan')}
            {row('Owner 1 Salary ($)', 'owner1_salary', 'number', '140000')}
            {row('Owner 1 Share (%)', 'owner1_share', 'number', '50')}
            {row('Owner 1 Marginal Rate (%)', 'owner1_tax_rate', 'number', '37')}
            {row('Owner 2 Name', 'owner2_name', 'text', 'Partner')}
            {row('Owner 2 Salary ($)', 'owner2_salary', 'number', '140000')}
            {row('Owner 2 Share (%)', 'owner2_share', 'number', '50')}
            {row('Owner 2 Marginal Rate (%)', 'owner2_tax_rate', 'number', '37')}
            {row('Medicare Levy (%)', 'medicare_levy', 'number', '2')}
          </div>
          {error && (
            <div className="mt-4 text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>
              {error}
            </div>
          )}
        </div>
        <div className="px-6 py-4 flex justify-end gap-3 shrink-0" style={{ borderTop: '1px solid rgba(99,102,241,0.2)' }}>
          <button onClick={onCancel} className="btn-ghost px-4 py-2 text-sm rounded-lg">Cancel</button>
          <button onClick={onSave} disabled={saving}
            className="btn-gradient px-5 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50 flex items-center gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}Save Property
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Inline quick-edit panel ───────────────────────────────────────────────────
interface QuickEditProps {
  editF: PropForm
  upEdit: (k: string, v: string) => void
  onSave: () => void
  onFullEdit: () => void
  saving: boolean
  error: string
}
function QuickEditPanel({ editF, upEdit, onSave, onFullEdit, saving, error }: QuickEditProps) {
  const FIELDS: [string, string, string][] = [
    ['Settlement Date',      'settlement_date',  'date'],
    ['Deposit Paid ($)',      'deposit_paid',     'number'],
    ['EMI Start Date',       'emi_start_date',   'date'],
    ['Loan Balance ($)',      'loan_outstanding', 'number'],
    ['Weekly Rent ($)',       'weekly_rent',      'number'],
    ['Tenancy Start',        'tenancy_start',    'date'],
    ['Interest Rate (%)',    'loan_rate',        'number'],
    ['Current Valuation ($)', 'current_valuation','number'],
  ]
  return (
    <div className="p-5" style={{ borderBottom: '1px solid rgba(99,102,241,0.1)', background: 'rgba(99,102,241,0.03)' }}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {FIELDS.map(([label, key, type]) => (
          <div key={key}>
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-1 block" style={LC}>{label}</label>
            <input
              type={type}
              value={(editF as Record<string, string>)[key]}
              onChange={e => upEdit(key, e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg text-xs input-dark"
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button onClick={onSave} disabled={saving}
          className="btn-gradient flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs text-white font-semibold disabled:opacity-50">
          {saving && <Loader2 className="h-3 w-3 animate-spin" />}Save Changes
        </button>
        <button onClick={onFullEdit} className="btn-ghost px-3 py-1.5 rounded-lg text-xs" style={LC}>
          Full Edit →
        </button>
        {error && <span className="text-[11px] text-red-400">{error}</span>}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN CLIENT COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
interface Props {
  properties: RealEstate[]
  expenses: RealEstateExpense[]
  income: RealEstateIncome[]
  userId: string
}

export function RealEstateClient({ properties, expenses: initExp, income: initInc, userId }: Props) {
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [tab,          setTab]          = useState<'properties' | 'income' | 'expenses' | 'summary'>('properties')
  const [selectedFY,   setSelectedFY]   = useState(currentFY())
  const [filterPropId, setFilterPropId] = useState('')
  const [editPropId,   setEditPropId]   = useState<string | null>(null)

  const [expenses, setExpenses] = useState(initExp)
  const [income,   setIncome]   = useState(initInc)

  const [showProp,    setShowProp]    = useState(false)
  const [showExp,     setShowExp]     = useState(false)
  const [showInc,     setShowInc]     = useState(false)
  const [showFullEdit, setShowFullEdit] = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  const [propF, setPropF] = useState<PropForm>({ ...PROP_DEFAULTS })
  const [editF, setEditF] = useState<PropForm>({ ...PROP_DEFAULTS })

  const makeExpInit = () => ({ property_id: properties[0]?.id ?? '', date: new Date().toISOString().split('T')[0], amount: '', category: ATO_CATS[0].cat, description: '', deductibility: ATO_CATS[0].deduct, file: null as File | null })
  const makeIncInit = () => ({ property_id: properties[0]?.id ?? '', date: new Date().toISOString().split('T')[0], amount: '', description: 'Rental income' })
  const [expF, setExpF] = useState(makeExpInit)
  const [incF, setIncF] = useState(makeIncInit)

  // Derived
  const allFYs = Array.from(new Set([
    currentFY(),
    ...expenses.map(e => recordFY(e.date)),
    ...income.map(i => recordFY(i.date)),
  ])).sort().reverse()

  const filteredExp  = expenses.filter(e => recordFY(e.date) === selectedFY && (!filterPropId || e.property_id === filterPropId))
  const filteredInc  = income.filter(i => recordFY(i.date) === selectedFY && (!filterPropId || i.property_id === filterPropId))
  const totalValue   = properties.reduce((s, p) => s + (p.current_valuation ?? p.purchase_price ?? 0), 0)
  const totalEquity  = properties.reduce((s, p) => s + (p.deposit_paid ?? 0), 0)
  const totalLoan    = properties.reduce((s, p) => s + (p.loan_outstanding ?? 0), 0)
  const fyIncome     = filteredInc.reduce((s, i) => s + i.amount, 0)
  const fyExpenses   = filteredExp.reduce((s, e) => s + e.amount, 0)
  const fyDeductible = filteredExp.filter(e => {
    const c = ATO_CATS.find(x => x.cat === e.category)
    return c?.deduct === 'Fully deductible' || c?.deduct === 'Depreciation (non-cash)'
  }).reduce((s, e) => s + e.amount, 0)
  const fyNet = fyIncome - fyExpenses

  function propName(id: string) { return properties.find(p => p.id === id)?.name ?? 'Unknown' }
  function upProp(k: string, v: string) { setPropF(f => ({ ...f, [k]: v })) }
  function upEdit(k: string, v: string) { setEditF(f => ({ ...f, [k]: v })) }

  function onExpCategoryChange(cat: string) {
    const found = ATO_CATS.find(c => c.cat === cat)
    setExpF(f => ({ ...f, category: cat, deductibility: found?.deduct ?? 'Fully deductible' }))
  }

  function formToInsert(f: PropForm, uid: string) {
    const n = (k: string) => { const v = parseFloat((f as Record<string, string>)[k]); return isNaN(v) ? null : v }
    const s = (k: string) => (f as Record<string, string>)[k] || null
    return {
      user_id: uid, name: f.name, address: f.address || null,
      property_type: f.property_type, country: f.country, currency: f.currency,
      year_built:         n('year_built'),
      purchase_price:     n('purchase_price'),
      purchase_date:      s('purchase_date'),
      settlement_date:    s('settlement_date'),
      deposit_paid:       n('deposit_paid'),
      loan_amount:        n('loan_amount'),
      loan_outstanding:   n('loan_outstanding') ?? n('loan_amount') ?? 0,
      loan_rate:          n('loan_rate'),
      loan_type:          f.loan_type,
      loan_term_years:    n('loan_term_years'),
      rate_type:          f.rate_type,
      lender:             s('lender'),
      emi_start_date:     s('emi_start_date'),
      payment_freq:       f.payment_freq,
      current_valuation:  n('current_valuation'),
      valuation_date:     s('valuation_date'),
      growth_rate:        n('growth_rate') != null ? (n('growth_rate')! / 100) : null,
      tenancy_start:      s('tenancy_start'),
      weekly_rent:        n('weekly_rent'),
      vacancy_weeks:      n('vacancy_weeks'),
      property_mgmt_pct:  n('property_mgmt_pct') != null ? (n('property_mgmt_pct')! / 100) : null,
      council_rates:      n('council_rates'),
      water_rates:        n('water_rates'),
      landlord_insurance: n('landlord_insurance'),
      repairs_maintenance:n('repairs_maintenance'),
      accounting:         n('accounting'),
      quantity_surveyor:  n('quantity_surveyor'),
      sundry:             n('sundry'),
      div43_annual:       n('div43_annual'),
      div40_annual:       n('div40_annual'),
      owner1_name:        s('owner1_name'),
      owner1_salary:      n('owner1_salary'),
      owner1_share:       n('owner1_share') != null ? (n('owner1_share')! / 100) : 0.5,
      owner1_tax_rate:    n('owner1_tax_rate') != null ? (n('owner1_tax_rate')! / 100) : 0.37,
      owner2_name:        s('owner2_name'),
      owner2_salary:      n('owner2_salary'),
      owner2_share:       n('owner2_share') != null ? (n('owner2_share')! / 100) : 0.5,
      owner2_tax_rate:    n('owner2_tax_rate') != null ? (n('owner2_tax_rate')! / 100) : 0.37,
      medicare_levy:      n('medicare_levy') != null ? (n('medicare_levy')! / 100) : 0.02,
      property_status:    f.property_status || 'Pre-settlement',
      rental_income_monthly: null,
      expenses_monthly:      null,
    }
  }

  function openEdit(p: RealEstate) {
    setEditF({
      name: p.name, address: p.address ?? '', property_type: p.property_type,
      country: p.country, currency: p.currency,
      year_built:          String(p.year_built ?? ''),
      purchase_price:      String(p.purchase_price ?? ''),
      purchase_date:       p.purchase_date ?? '',
      settlement_date:     p.settlement_date ?? '',
      deposit_paid:        String(p.deposit_paid ?? ''),
      loan_amount:         String(p.loan_amount ?? ''),
      loan_outstanding:    String(p.loan_outstanding ?? ''),
      loan_rate:           String(p.loan_rate ?? ''),
      loan_type:           p.loan_type ?? 'P&I',
      loan_term_years:     String(p.loan_term_years ?? 30),
      rate_type:           p.rate_type ?? 'Variable',
      lender:              p.lender ?? '',
      emi_start_date:      p.emi_start_date ?? '',
      payment_freq:        p.payment_freq ?? 'Monthly',
      current_valuation:   String(p.current_valuation ?? ''),
      valuation_date:      p.valuation_date ?? '',
      growth_rate:         p.growth_rate != null ? String(p.growth_rate * 100) : '4',
      tenancy_start:       p.tenancy_start ?? '',
      weekly_rent:         String(p.weekly_rent ?? ''),
      vacancy_weeks:       String(p.vacancy_weeks ?? 2),
      property_mgmt_pct:   p.property_mgmt_pct != null ? String(p.property_mgmt_pct * 100) : '6.6',
      council_rates:       String(p.council_rates ?? ''),
      water_rates:         String(p.water_rates ?? ''),
      landlord_insurance:  String(p.landlord_insurance ?? ''),
      repairs_maintenance: String(p.repairs_maintenance ?? ''),
      accounting:          String(p.accounting ?? ''),
      quantity_surveyor:   String(p.quantity_surveyor ?? ''),
      sundry:              String(p.sundry ?? ''),
      div43_annual:        String(p.div43_annual ?? ''),
      div40_annual:        String(p.div40_annual ?? ''),
      owner1_name:         p.owner1_name ?? '',
      owner1_salary:       String(p.owner1_salary ?? ''),
      owner1_share:        p.owner1_share != null ? String(p.owner1_share * 100) : '50',
      owner1_tax_rate:     p.owner1_tax_rate != null ? String(p.owner1_tax_rate * 100) : '37',
      owner2_name:         p.owner2_name ?? '',
      owner2_salary:       String(p.owner2_salary ?? ''),
      owner2_share:        p.owner2_share != null ? String(p.owner2_share * 100) : '50',
      owner2_tax_rate:     p.owner2_tax_rate != null ? String(p.owner2_tax_rate * 100) : '37',
      medicare_levy:       p.medicare_levy != null ? String(p.medicare_levy * 100) : '2',
      property_status:     p.property_status ?? 'Pre-settlement',
    })
    setEditPropId(p.id)
  }

  async function saveNewProperty() {
    if (!propF.name) return
    setSaving(true); setError('')
    const { error } = await createClient().from('real_estate').insert(formToInsert(propF, userId))
    setSaving(false)
    if (error) { setError(error.message); return }
    setShowProp(false); setPropF({ ...PROP_DEFAULTS }); router.refresh()
  }

  async function saveEditProperty(id: string) {
    setSaving(true); setError('')
    const { error } = await createClient().from('real_estate').update(formToInsert(editF, userId)).eq('id', id)
    setSaving(false)
    if (error) { setError(error.message); return }
    setEditPropId(null); setShowFullEdit(false); router.refresh()
  }

  async function saveExpense() {
    if (!expF.amount || !expF.property_id) return
    setSaving(true); setError('')
    const supabase = createClient()
    let receiptUrl: string | null = null
    if (expF.file) {
      const ext  = expF.file.name.split('.').pop()
      const path = `${userId}/${expF.property_id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('property-receipts').upload(path, expF.file)
      if (!upErr) {
        const { data } = supabase.storage.from('property-receipts').getPublicUrl(path)
        receiptUrl = data.publicUrl
      }
    }
    const isDeductible = expF.deductibility === 'Fully deductible' || expF.deductibility === 'Depreciation (non-cash)'
    const { data, error } = await supabase.from('real_estate_expenses').insert({
      user_id: userId, property_id: expF.property_id, date: expF.date,
      amount: parseFloat(expF.amount), category: expF.category,
      description: expF.description || null, is_deductible: isDeductible, receipt_url: receiptUrl,
    }).select().single()
    setSaving(false)
    if (error) { setError(error.message); return }
    if (data) setExpenses(prev => [data as RealEstateExpense, ...prev])
    setShowExp(false); setExpF(makeExpInit())
  }

  async function saveIncome() {
    if (!incF.amount || !incF.property_id) return
    setSaving(true); setError('')
    const { data, error } = await createClient().from('real_estate_income').insert({
      user_id: userId, property_id: incF.property_id, date: incF.date,
      amount: parseFloat(incF.amount), description: incF.description || null,
    }).select().single()
    setSaving(false)
    if (error) { setError(error.message); return }
    if (data) setIncome(prev => [data as RealEstateIncome, ...prev])
    setShowInc(false); setIncF(makeIncInit())
  }

  async function deleteExpense(id: string) {
    await createClient().from('real_estate_expenses').delete().eq('id', id)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }
  async function deleteIncome(id: string) {
    await createClient().from('real_estate_income').delete().eq('id', id)
    setIncome(prev => prev.filter(i => i.id !== id))
  }

  function exportCSV() {
    const rows = [
      [`WealthLens Real Estate — ${fyLabel(selectedFY)}`], [],
      ['INCOME'], ['Date', 'Property', 'Description', 'Amount'],
      ...filteredInc.map(i => [i.date, propName(i.property_id), i.description ?? '', i.amount.toFixed(2)]),
      ['', '', 'TOTAL INCOME', fyIncome.toFixed(2)], [],
      ['EXPENSES'], ['Date', 'Property', 'Category', 'Description', 'Deductibility', 'Amount'],
      ...filteredExp.map(e => {
        const c = ATO_CATS.find(x => x.cat === e.category)
        return [e.date, propName(e.property_id), e.category, e.description ?? '', c?.deduct ?? '', e.amount.toFixed(2)]
      }),
      ['', '', '', '', 'TOTAL EXPENSES', fyExpenses.toFixed(2)],
      ['', '', '', '', 'DEDUCTIBLE', fyDeductible.toFixed(2)], [],
      ['SUMMARY'], ['Net Rental Position', (fyIncome - fyExpenses).toFixed(2)],
    ]
    const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = `real-estate-${selectedFY}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  // Which property is currently being fully edited
  const fullEditProp = editPropId ? properties.find(p => p.id === editPropId) : null

  return (
    <div className="space-y-5">

      {/* Top stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Portfolio Value', value: formatAUD(totalValue),  grad: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', sh: 'rgba(139,92,246,0.3)', icon: <Home className="h-4 w-4 text-white" /> },
          { label: 'Total Equity',    value: formatAUD(totalEquity), grad: 'linear-gradient(135deg,#10b981,#059669)', sh: 'rgba(16,185,129,0.3)',  icon: <TrendingUp className="h-4 w-4 text-white" /> },
          { label: 'Total Loan',      value: formatAUD(totalLoan),   grad: 'linear-gradient(135deg,#ef4444,#dc2626)', sh: 'rgba(239,68,68,0.3)',   icon: <DollarSign className="h-4 w-4 text-white" /> },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-5 flex flex-col gap-3" style={CARD}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={LC}>{s.label}</span>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: s.grad, boxShadow: `0 4px 12px ${s.sh}` }}>{s.icon}</div>
            </div>
            <p className="text-2xl font-bold tracking-tight" style={TC}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 rounded-xl p-1" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', width: 'fit-content' }}>
        {([
          { id: 'properties', label: 'Properties', icon: <Home className="h-3.5 w-3.5" /> },
          { id: 'income',     label: 'Income',     icon: <TrendingUp className="h-3.5 w-3.5" /> },
          { id: 'expenses',   label: 'Expenses',   icon: <Receipt className="h-3.5 w-3.5" /> },
          { id: 'summary',    label: 'FY Summary', icon: <BarChart3 className="h-3.5 w-3.5" /> },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            style={tab === t.id
              ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', boxShadow: '0 2px 12px rgba(99,102,241,0.4)' }
              : { color: 'rgba(161,174,255,0.6)' }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Properties ── */}
      {tab === 'properties' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FilterBar
              selectedFY={selectedFY} setSelectedFY={setSelectedFY}
              allFYs={allFYs} filterPropId={filterPropId}
              setFilterPropId={setFilterPropId} properties={properties}
            />
            <button onClick={() => { setError(''); setShowProp(true) }}
              className="btn-gradient flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white">
              <Plus className="h-3 w-3" />Add Property
            </button>
          </div>

          {properties.length === 0 ? (
            <div className="rounded-2xl flex flex-col items-center justify-center py-20 text-center" style={CARD}>
              <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', boxShadow: '0 8px 24px rgba(139,92,246,0.3)' }}>
                <Home className="h-8 w-8 text-white" />
              </div>
              <p className="font-semibold mb-1" style={TC}>No properties yet</p>
              <p className="text-sm mb-4" style={LC}>Track investment properties with auto cash-flow and tax analysis</p>
              <button onClick={() => setShowProp(true)} className="btn-gradient px-4 py-2 rounded-lg text-sm text-white">
                Add your first property →
              </button>
            </div>
          ) : properties.map(p => {
            const cf        = calcCF(p, expenses, income, selectedFY)
            const isEditing = editPropId === p.id
            const statusColor = p.property_status === 'Tenanted'
              ? { bg: 'rgba(16,185,129,0.12)',  text: '#6ee7b7' }
              : p.property_status === 'Pre-tenancy'
              ? { bg: 'rgba(245,158,11,0.12)',  text: '#fcd34d' }
              : { bg: 'rgba(99,102,241,0.12)',  text: '#a5b4fc' }

            return (
              <div key={p.id} className="rounded-2xl overflow-hidden" style={CARD}>
                {/* Header */}
                <div className="px-5 py-4 flex items-start gap-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}>
                    <Home className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold" style={TC}>{p.name}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: statusColor.bg, color: statusColor.text }}>
                        {p.property_status ?? 'Pre-settlement'}
                      </span>
                      {p.lender && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>{p.lender}</span>
                      )}
                    </div>
                    {p.address && <p className="text-xs mt-0.5 truncate" style={LC}>{p.address}</p>}
                    {p.loan_type && (
                      <p className="text-[10px] mt-0.5" style={{ color: 'rgba(161,174,255,0.35)' }}>
                        {p.loan_type} · {p.rate_type} · {p.loan_rate}% · {p.loan_term_years}yr
                      </p>
                    )}
                  </div>
                  <button onClick={() => isEditing ? setEditPropId(null) : openEdit(p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all shrink-0"
                    style={isEditing
                      ? { background: 'rgba(239,68,68,0.12)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }
                      : { background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
                    {isEditing ? <><X className="h-3 w-3" />Close</> : <><Edit2 className="h-3 w-3" />Edit</>}
                  </button>
                </div>

                {/* Quick-edit panel */}
                {isEditing && (
                  <QuickEditPanel
                    editF={editF}
                    upEdit={upEdit}
                    onSave={() => saveEditProperty(p.id)}
                    onFullEdit={() => setShowFullEdit(true)}
                    saving={saving}
                    error={error}
                  />
                )}

                {/* Key metrics */}
                <div className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {[
                      { label: 'Purchase Price',   val: formatAUD(p.purchase_price) },
                      { label: 'Loan Balance',      val: formatAUD(cf.loanBalance),    red: true },
                      { label: 'Deposit / Equity',  val: formatAUD(cf.equity),         green: true },
                      { label: 'Est. Value',         val: formatAUD(cf.estimatedValue) },
                    ].map(m => (
                      <div key={m.label} className="rounded-xl p-3" style={{
                        background: m.green ? 'rgba(16,185,129,0.07)' : m.red ? 'rgba(239,68,68,0.07)' : 'rgba(99,102,241,0.06)',
                        border: `1px solid ${m.green ? 'rgba(16,185,129,0.12)' : m.red ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)'}`,
                      }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={LC}>{m.label}</p>
                        <p className={`font-bold text-sm ${m.green ? 'text-emerald-400' : m.red ? 'text-red-400' : ''}`}
                          style={m.green || m.red ? {} : TC}>{m.val}</p>
                      </div>
                    ))}
                  </div>

                  {(p.weekly_rent ?? 0) > 0 && (
                    <div className="flex gap-4 text-xs mb-4 flex-wrap">
                      <span style={LC}>Weekly rent: <strong style={TC}>{formatAUD(p.weekly_rent)}</strong></span>
                      <span style={LC}>Gross yield: <strong style={{ color: '#818cf8' }}>{cf.grossYield.toFixed(2)}%</strong></span>
                      {p.tenancy_start && <span style={LC}>Tenancy from: <strong style={TC}>{p.tenancy_start}</strong></span>}
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(161,174,255,0.5)' }}>
                      {fyLabel(selectedFY)} Cash Flow
                    </p>
                    <CashFlowTable p={p} expenses={expenses} income={income} selectedFY={selectedFY} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── TAB: Income ── */}
      {tab === 'income' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <FilterBar selectedFY={selectedFY} setSelectedFY={setSelectedFY} allFYs={allFYs}
              filterPropId={filterPropId} setFilterPropId={setFilterPropId} properties={properties} />
            <button onClick={() => { setError(''); setIncF(makeIncInit()); setShowInc(true) }}
              className="btn-gradient flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white"
              disabled={properties.length === 0}>
              <Plus className="h-3 w-3" />Add Income
            </button>
          </div>
          <div className="rounded-xl px-4 py-3 flex items-center gap-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <TrendingUp className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-500">Total Rental Income {selectedFY}</p>
              <p className="text-xl font-black text-emerald-400">{formatAUD(fyIncome)}</p>
            </div>
            <p className="ml-auto text-xs" style={LC}>{filteredInc.length} entries</p>
          </div>
          <div className="rounded-2xl overflow-hidden" style={CARD}>
            {filteredInc.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <TrendingUp className="h-9 w-9 mb-3" style={{ color: 'rgba(99,102,241,0.3)' }} />
                <p className="text-sm" style={LC}>No income for {fyLabel(selectedFY)}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.12)', background: 'rgba(99,102,241,0.04)' }}>
                    {['Date', 'Property', 'Description', 'Amount', ''].map(h => (
                      <th key={h} className={`px-5 py-3 text-[10px] font-semibold uppercase tracking-widest ${h === 'Amount' ? 'text-right' : 'text-left'}`} style={LC}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredInc.map(i => (
                    <tr key={i.id} className="group" style={{ borderBottom: '1px solid rgba(99,102,241,0.07)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.04)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
                      <td className="px-5 py-3 text-xs" style={LC}>{i.date}</td>
                      <td className="px-5 py-3"><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>{propName(i.property_id)}</span></td>
                      <td className="px-5 py-3 text-xs" style={TC}>{i.description ?? '—'}</td>
                      <td className="px-5 py-3 text-right font-bold text-emerald-400 tabular-nums">+{formatAUD(i.amount)}</td>
                      <td className="px-3 py-3">
                        <button onClick={() => deleteIncome(i.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded" style={{ color: 'rgba(239,68,68,0.6)' }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Expenses ── */}
      {tab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <FilterBar selectedFY={selectedFY} setSelectedFY={setSelectedFY} allFYs={allFYs}
              filterPropId={filterPropId} setFilterPropId={setFilterPropId} properties={properties} />
            <button onClick={() => { setError(''); setExpF(makeExpInit()); setShowExp(true) }}
              className="btn-gradient flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white"
              disabled={properties.length === 0}>
              <Plus className="h-3 w-3" />Log Expense
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Expenses',  val: formatAUD(fyExpenses),              shade: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   tc: 'text-red-400' },
              { label: 'Deductible',      val: formatAUD(fyDeductible),            shade: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', tc: 'text-emerald-400' },
              { label: 'Non-Deductible',  val: formatAUD(fyExpenses-fyDeductible), shade: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', tc: 'text-amber-400' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-4 flex items-center gap-3" style={{ background: s.shade, border: `1px solid ${s.border}` }}>
                <p className="flex-1 text-[11px] font-semibold uppercase tracking-wider" style={LC}>{s.label}</p>
                <p className={`text-lg font-black tabular-nums ${s.tc}`}>{s.val}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl overflow-hidden" style={CARD}>
            {filteredExp.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <Receipt className="h-9 w-9 mb-3" style={{ color: 'rgba(99,102,241,0.3)' }} />
                <p className="text-sm" style={LC}>No expenses for {fyLabel(selectedFY)}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.12)', background: 'rgba(99,102,241,0.04)' }}>
                    {['Date', 'Property', 'Category', 'Description', 'Deductibility', 'Amount', ''].map((h, i) => (
                      <th key={h} className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-widest ${i === 5 ? 'text-right' : 'text-left'}`} style={LC}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredExp.map(e => {
                    const atoCat = ATO_CATS.find(c => c.cat === e.category)
                    const isDeductible = atoCat?.deduct === 'Fully deductible' || atoCat?.deduct === 'Depreciation (non-cash)'
                    return (
                      <tr key={e.id} className="group" style={{ borderBottom: '1px solid rgba(99,102,241,0.07)' }}
                        onMouseEnter={el => { (el.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.04)' }}
                        onMouseLeave={el => { (el.currentTarget as HTMLElement).style.background = '' }}>
                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={LC}>{e.date}</td>
                        <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>{propName(e.property_id)}</span></td>
                        <td className="px-4 py-3 text-xs font-medium" style={TC}>{e.category}</td>
                        <td className="px-4 py-3 text-xs max-w-[150px] truncate" style={LC}>
                          {e.description ?? '—'}
                          {e.receipt_url && <a href={e.receipt_url} target="_blank" rel="noreferrer" className="ml-1 inline-flex"><ExternalLink className="h-3 w-3" style={{ color: '#818cf8' }} /></a>}
                        </td>
                        <td className="px-4 py-3 text-[11px]" style={{ color: isDeductible ? '#6ee7b7' : '#fcd34d' }}>{atoCat?.deduct ?? '—'}</td>
                        <td className="px-4 py-3 text-right font-bold text-red-400 tabular-nums text-xs">{formatAUD(e.amount)}</td>
                        <td className="px-3 py-3">
                          <button onClick={() => deleteExpense(e.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded" style={{ color: 'rgba(239,68,68,0.6)' }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: FY Summary ── */}
      {tab === 'summary' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <FilterBar selectedFY={selectedFY} setSelectedFY={setSelectedFY} allFYs={allFYs}
              filterPropId={filterPropId} setFilterPropId={setFilterPropId} properties={properties} />
            <button onClick={exportCSV} className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={TC}>
              <FileDown className="h-3.5 w-3.5" />Export CSV
            </button>
          </div>

          <div className="rounded-2xl p-6 relative overflow-hidden"
            style={{ background: fyNet >= 0 ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}>
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <p className="text-xs font-bold text-white/60 uppercase tracking-[0.15em] mb-1">Net Rental {fyNet >= 0 ? 'Profit' : 'Loss'} — {fyLabel(selectedFY)}</p>
            <p className="text-4xl font-black text-white">{formatAUD(Math.abs(fyNet))}</p>
            <p className="text-sm text-white/70 mt-2">{formatAUD(fyIncome)} income − {formatAUD(fyExpenses)} expenses</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl overflow-hidden" style={CARD}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
                <h3 className="font-semibold text-sm" style={TC}>Rental Income</h3>
              </div>
              {filteredInc.length === 0 ? <p className="px-5 py-8 text-sm text-center" style={LC}>No income in this period</p> : (
                <div className="p-5 space-y-3">
                  {properties.filter(p => !filterPropId || p.id === filterPropId).map(p => {
                    const amt = filteredInc.filter(i => i.property_id === p.id).reduce((s, i) => s + i.amount, 0)
                    if (amt === 0) return null
                    const pct = fyIncome > 0 ? (amt / fyIncome) * 100 : 0
                    return (
                      <div key={p.id}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span style={TC}>{p.name}</span>
                          <span className="font-bold text-emerald-400">{formatAUD(amt)}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(16,185,129,0.12)' }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#10b981,#059669)' }} />
                        </div>
                      </div>
                    )
                  })}
                  <div className="flex justify-between text-sm font-bold pt-2 mt-2" style={{ borderTop: '1px solid rgba(99,102,241,0.12)', color: '#6ee7b7' }}>
                    <span>Total</span><span>{formatAUD(fyIncome)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl overflow-hidden" style={CARD}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
                <h3 className="font-semibold text-sm" style={TC}>ATO Expense Breakdown</h3>
              </div>
              {filteredExp.length === 0 ? <p className="px-5 py-8 text-sm text-center" style={LC}>No expenses in this period</p> : (
                <div className="p-5 space-y-2.5">
                  {ATO_CATS
                    .map(cat => ({ ...cat, amt: filteredExp.filter(e => e.category === cat.cat).reduce((s, e) => s + e.amount, 0) }))
                    .filter(cat => cat.amt > 0)
                    .sort((a, b) => b.amt - a.amt)
                    .map(cat => {
                      const pct = fyExpenses > 0 ? (cat.amt / fyExpenses) * 100 : 0
                      const isDeductible = cat.deduct === 'Fully deductible' || cat.deduct === 'Depreciation (non-cash)'
                      return (
                        <div key={cat.cat}>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <div className="flex items-center gap-1.5">
                              {isDeductible ? <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" /> : <XCircle className="h-3 w-3 text-amber-400 shrink-0" />}
                              <span style={TC}>{cat.cat}</span>
                            </div>
                            <span className="font-bold text-red-400">{formatAUD(cat.amt)}</span>
                          </div>
                          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(239,68,68,0.1)' }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: isDeductible ? 'linear-gradient(90deg,#6366f1,#8b5cf6)' : 'linear-gradient(90deg,#f59e0b,#d97706)' }} />
                          </div>
                        </div>
                      )
                    })}
                  <div className="pt-3 space-y-1" style={{ borderTop: '1px solid rgba(99,102,241,0.12)' }}>
                    <div className="flex justify-between text-xs"><span className="text-emerald-400">Deductible total</span><span className="font-bold text-emerald-400">{formatAUD(fyDeductible)}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-amber-400">CGT cost base / non-ded.</span><span className="font-bold text-amber-400">{formatAUD(fyExpenses - fyDeductible)}</span></div>
                    <div className="flex justify-between text-sm font-bold pt-1" style={{ color: '#fca5a5' }}><span>Total expenses</span><span>{formatAUD(fyExpenses)}</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {properties.filter(p => !filterPropId || p.id === filterPropId).map(p => {
            const cf = calcCF(p, expenses, income, selectedFY)
            if (cf.status !== 'active') return null
            return (
              <div key={p.id} className="rounded-2xl overflow-hidden" style={CARD}>
                <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
                  <p className="font-semibold text-sm" style={TC}>{p.name} — Calculated Cash Flow</p>
                  <p className="text-xs mt-0.5" style={LC}>Auto-estimated · logged expenses take precedence</p>
                </div>
                <div className="p-5">
                  <CashFlowTable p={p} expenses={expenses} income={income} selectedFY={selectedFY} />
                </div>
              </div>
            )
          })}

          <div className="rounded-xl px-4 py-3 text-xs flex items-start gap-2"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: 'rgba(251,191,36,0.8)' }}>
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>Guide only, not tax advice. Confirm deductibility with your registered tax agent before lodging.</span>
          </div>
        </div>
      )}

      {/* MODAL: Add Property */}
      {showProp && (
        <PropertyForm
          f={propF} up={upProp}
          title="Add Investment Property"
          subtitle="Fill in the details — cash flow and tax impact calculate automatically"
          onSave={saveNewProperty}
          onCancel={() => { setShowProp(false); setError('') }}
          saving={saving} error={error}
        />
      )}

      {/* MODAL: Full Edit */}
      {showFullEdit && fullEditProp && (
        <PropertyForm
          f={editF} up={upEdit}
          title={`Edit — ${fullEditProp.name}`}
          subtitle="All changes save to the database on click"
          onSave={() => saveEditProperty(fullEditProp.id)}
          onCancel={() => { setShowFullEdit(false); setError('') }}
          saving={saving} error={error}
        />
      )}

      {/* MODAL: Log Expense */}
      {showExp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl max-h-[90vh] flex flex-col" style={MODAL}>
            <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
              <div><h2 className="font-bold text-lg" style={TC}>Log Expense</h2><p className="text-xs mt-0.5" style={LC}>ATO categorised property expense</p></div>
              <button onClick={() => setShowExp(false)} className="h-8 w-8 rounded-lg flex items-center justify-center" style={LC}><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Property</label>
                  <select value={expF.property_id} onChange={e => setExpF(f => ({ ...f, property_id: e.target.value }))} className="w-full h-10 px-3 rounded-lg text-sm input-dark">
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Date</label>
                  <input type="date" value={expF.date} onChange={e => setExpF(f => ({ ...f, date: e.target.value }))} className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>ATO Category</label>
                <select value={expF.category} onChange={e => onExpCategoryChange(e.target.value)} className="w-full h-10 px-3 rounded-lg text-sm input-dark">
                  {ATO_CATS.map(c => <option key={c.cat} value={c.cat}>{c.cat}</option>)}
                </select>
              </div>
              {(() => {
                const atoCat = ATO_CATS.find(c => c.cat === expF.category)
                const isGood = atoCat?.deduct === 'Fully deductible' || atoCat?.deduct === 'Depreciation (non-cash)'
                return (
                  <div className="rounded-lg px-3 py-2.5" style={{ background: isGood ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${isGood ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                    <p className="text-xs font-semibold" style={{ color: isGood ? '#6ee7b7' : '#fcd34d' }}>{atoCat?.deduct ?? '—'}</p>
                    {atoCat?.note && <p className="text-[11px] mt-0.5" style={LC}>{atoCat.note}</p>}
                  </div>
                )
              })()}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Amount (AUD)</label>
                <input type="number" step="0.01" value={expF.amount} onChange={e => setExpF(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Description</label>
                <input value={expF.description} onChange={e => setExpF(f => ({ ...f, description: e.target.value }))} placeholder="e.g. ANZ mortgage interest — April" className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Receipt (PDF / Image)</label>
                <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => setExpF(f => ({ ...f, file: e.target.files?.[0] ?? null }))} />
                <button onClick={() => fileRef.current?.click()} className="w-full h-10 rounded-lg text-xs flex items-center justify-center gap-2 transition-all"
                  style={{ border: '1px dashed rgba(99,102,241,0.3)', background: expF.file ? 'rgba(16,185,129,0.08)' : 'rgba(99,102,241,0.05)', color: expF.file ? '#6ee7b7' : 'rgba(161,174,255,0.5)' }}>
                  {expF.file ? <><CheckCircle2 className="h-4 w-4" />{expF.file.name}</> : <><Upload className="h-4 w-4" />Upload receipt</>}
                </button>
              </div>
              {error && <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>{error}</div>}
            </div>
            <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: '1px solid rgba(99,102,241,0.2)' }}>
              <button onClick={() => setShowExp(false)} className="btn-ghost px-4 py-2 text-sm rounded-lg">Cancel</button>
              <button onClick={saveExpense} disabled={saving || !expF.amount || !expF.property_id}
                className="btn-gradient px-5 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}Log Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Income */}
      {showInc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-2xl flex flex-col" style={MODAL}>
            <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
              <div><h2 className="font-bold text-lg" style={TC}>Record Income</h2><p className="text-xs mt-0.5" style={LC}>Log actual rental received</p></div>
              <button onClick={() => setShowInc(false)} className="h-8 w-8 rounded-lg flex items-center justify-center" style={LC}><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Property</label>
                <select value={incF.property_id} onChange={e => setIncF(f => ({ ...f, property_id: e.target.value }))} className="w-full h-10 px-3 rounded-lg text-sm input-dark">
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Date</label>
                  <input type="date" value={incF.date} onChange={e => setIncF(f => ({ ...f, date: e.target.value }))} className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Amount (AUD)</label>
                  <input type="number" step="0.01" value={incF.amount} onChange={e => setIncF(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={LC}>Description</label>
                <input value={incF.description} onChange={e => setIncF(f => ({ ...f, description: e.target.value }))} placeholder="Rental income" className="w-full h-10 px-3 rounded-lg text-sm input-dark" />
              </div>
              {error && <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>{error}</div>}
            </div>
            <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: '1px solid rgba(99,102,241,0.2)' }}>
              <button onClick={() => setShowInc(false)} className="btn-ghost px-4 py-2 text-sm rounded-lg">Cancel</button>
              <button onClick={saveIncome} disabled={saving || !incF.amount || !incF.property_id}
                className="btn-gradient px-5 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
