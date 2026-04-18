import Decimal from 'decimal.js'
import type { MutualFundHolding, ETFHolding, Account, Superannuation, RealEstate, PortfolioSummary } from '@/types'

export function calcMFCurrentValueINR(holding: MutualFundHolding): number {
  if (!holding.current_nav) return 0
  return new Decimal(holding.units).times(holding.current_nav).toNumber()
}

export function calcMFGainLossINR(holding: MutualFundHolding): number {
  const current = calcMFCurrentValueINR(holding)
  return new Decimal(current).minus(holding.cost_basis_inr ?? 0).toNumber()
}

export function calcETFCurrentValueAUD(holding: ETFHolding): number {
  if (!holding.current_price) return 0
  return new Decimal(holding.shares).times(holding.current_price).toNumber()
}

export function calcETFGainLossAUD(holding: ETFHolding): number {
  const current = calcETFCurrentValueAUD(holding)
  return new Decimal(current).minus(holding.cost_basis ?? 0).toNumber()
}

export function calcRealEstateEquityAUD(property: RealEstate): number {
  return new Decimal(property.current_valuation ?? 0)
    .minus(property.loan_outstanding ?? 0)
    .toNumber()
}

export function buildPortfolioSummary(
  accounts: Account[],
  mfHoldings: MutualFundHolding[],
  etfHoldings: ETFHolding[],
  superAccounts: Superannuation[],
  properties: RealEstate[],
  inrAudRate: number
): PortfolioSummary {
  const accountsAUD = accounts
    .filter((a) => a.is_active && a.type !== 'credit')
    .reduce((sum, a) => {
      // All accounts assumed AUD for now; extend for multi-currency
      return new Decimal(sum).plus(a.balance).toNumber()
    }, 0)

  const liabilitiesAUD = accounts
    .filter((a) => a.type === 'credit')
    .reduce((sum, a) => new Decimal(sum).plus(Math.abs(a.balance)).toNumber(), 0)

  const mutualFundsAUD = mfHoldings.reduce((sum, h) => {
    const valueINR = calcMFCurrentValueINR(h)
    const valueAUD = new Decimal(valueINR).times(inrAudRate).toNumber()
    return new Decimal(sum).plus(valueAUD).toNumber()
  }, 0)

  const etfsAUD = etfHoldings.reduce((sum, h) => {
    return new Decimal(sum).plus(calcETFCurrentValueAUD(h)).toNumber()
  }, 0)

  const superAUD = superAccounts.reduce((sum, s) => {
    return new Decimal(sum).plus(s.balance ?? 0).toNumber()
  }, 0)

  const realEstateAUD = properties.reduce((sum, p) => {
    return new Decimal(sum).plus(p.current_valuation ?? 0).toNumber()
  }, 0)

  const totalAUD = new Decimal(accountsAUD)
    .plus(mutualFundsAUD)
    .plus(etfsAUD)
    .plus(superAUD)
    .plus(realEstateAUD)
    .toNumber()

  const netWorthAUD = new Decimal(totalAUD).minus(liabilitiesAUD).toNumber()

  return {
    totalAUD,
    accountsAUD,
    mutualFundsAUD,
    etfsAUD,
    superAUD,
    realEstateAUD,
    liabilitiesAUD,
    netWorthAUD,
    dayChangeAUD: 0,
    dayChangePercent: 0,
  }
}
