import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import Decimal from 'decimal.js'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number | null | undefined,
  currency: string = 'AUD',
  compact: boolean = false
): string {
  if (amount == null) return '—'
  const d = new Decimal(amount)
  const num = d.toNumber()

  const opts: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }

  if (compact && Math.abs(num) >= 1000) {
    opts.notation = 'compact'
    opts.maximumFractionDigits = 1
  }

  return new Intl.NumberFormat('en-AU', opts).format(num)
}

export function formatINR(amount: number | null | undefined): string {
  return formatCurrency(amount, 'INR')
}

export function formatAUD(amount: number | null | undefined, compact = false): string {
  return formatCurrency(amount, 'AUD', compact)
}

export function formatPercent(value: number | null | undefined, decimals = 2): string {
  if (value == null) return '—'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

export function gainLossColor(value: number | null | undefined): string {
  if (value == null) return 'text-muted-foreground'
  return value >= 0 ? 'text-emerald-500' : 'text-red-500'
}

export function calcGainLossPercent(current: number, cost: number): number {
  if (cost === 0) return 0
  return new Decimal(current).minus(cost).dividedBy(cost).times(100).toNumber()
}
