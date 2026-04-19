export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  base_currency: string
  timezone: string
  created_at: string
}

export interface Account {
  id: string
  user_id: string
  name: string
  type: 'savings' | 'checking' | 'credit' | 'investment'
  institution: string | null
  currency: string
  balance: number
  country: string
  is_active: boolean
  basiq_account_id: string | null
  basiq_connection_id: string | null
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  account_id: string | null
  date: string
  description: string
  amount: number
  currency: string
  type: 'income' | 'expense' | 'transfer'
  category: string | null
  subcategory: string | null
  payment_method: string | null
  tags: string[]
  notes: string | null
  is_recurring: boolean
  created_at: string
}

export interface MutualFundHolding {
  id: string
  user_id: string
  scheme_code: string | null
  isin: string | null
  scheme_name: string
  fund_house: string | null
  category: string | null
  sub_category: string | null
  units: number
  avg_purchase_nav: number | null
  current_nav: number | null
  nav_date: string | null
  cost_basis_inr: number | null
  current_value_inr: number | null
  current_value_aud: number | null
  inr_aud_rate: number | null
  sip_active: boolean
  sip_amount: number | null
  sip_date: number | null
  created_at: string
  updated_at: string
}

export interface ETFHolding {
  id: string
  user_id: string
  ticker: string
  exchange: 'ASX' | 'NYSE' | 'NASDAQ' | 'OTHER'
  name: string
  shares: number
  avg_purchase_price: number | null
  current_price: number | null
  price_updated_at: string | null
  currency: string
  cost_basis: number | null
  current_value_aud: number | null
  sector: string | null
  asset_class: string | null
  created_at: string
  updated_at: string
}

export interface Superannuation {
  id: string
  user_id: string
  fund_name: string
  member_number: string | null
  investment_option: string | null
  balance: number | null
  employer_contributions_ytd: number
  personal_contributions_ytd: number
  balance_date: string | null
  insurance_death_cover: number | null
  insurance_tpd_cover: number | null
  created_at: string
  updated_at: string
}

export interface RealEstate {
  id: string
  user_id: string
  name: string
  address: string | null
  property_type: 'residential' | 'commercial' | 'land'
  country: string
  currency: string
  purchase_price: number | null
  purchase_date: string | null
  current_valuation: number | null
  valuation_date: string | null
  loan_outstanding: number
  loan_rate: number | null
  rental_income_monthly: number | null
  expenses_monthly: number | null
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  user_id: string
  name: string
  category: string | null
  target_amount: number
  current_amount: number
  target_date: string | null
  currency: string
  priority: 'low' | 'medium' | 'high' | null
  linked_asset_ids: string[]
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ExchangeRate {
  from_currency: string
  to_currency: string
  rate: number
  fetched_at: string
}

export interface PortfolioSummary {
  totalAUD: number
  accountsAUD: number
  mutualFundsAUD: number
  etfsAUD: number
  superAUD: number
  realEstateAUD: number
  liabilitiesAUD: number
  netWorthAUD: number
  dayChangeAUD: number
  dayChangePercent: number
}
