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
  saltedge_account_id: string | null
  saltedge_connection_id: string | null
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
  // Purchase
  purchase_price: number | null
  purchase_date: string | null
  year_built: number | null
  // Loan
  loan_amount: number | null        // original loan at settlement
  loan_outstanding: number          // current outstanding balance
  loan_rate: number | null          // annual interest rate as % (e.g. 6.89)
  loan_type: string | null          // P&I | Interest Only
  loan_term_years: number | null
  rate_type: string | null          // Fixed | Variable
  lender: string | null
  // Settlement & repayments
  settlement_date: string | null
  deposit_paid: number | null       // cash paid at settlement → equity
  emi_start_date: string | null     // repayment commencement date
  payment_freq: string | null       // Monthly | Fortnightly | Weekly
  // Valuation
  current_valuation: number | null
  valuation_date: string | null
  growth_rate: number | null        // expected annual capital growth (e.g. 0.04 = 4%)
  // Rental
  tenancy_start: string | null
  weekly_rent: number | null
  vacancy_weeks: number | null      // assumed vacancy per year (weeks)
  property_mgmt_pct: number | null  // e.g. 0.066 = 6.6%
  // Legacy monthly fields
  rental_income_monthly: number | null
  expenses_monthly: number | null
  // Annual operating costs (used for FY cash flow auto-estimation)
  council_rates: number | null
  water_rates: number | null
  landlord_insurance: number | null
  repairs_maintenance: number | null
  accounting: number | null
  quantity_surveyor: number | null
  sundry: number | null
  div43_annual: number | null       // Div 43 building depreciation (annual)
  div40_annual: number | null       // Div 40 plant & equipment (annual)
  // Ownership & tax (for negative gearing calculation)
  owner1_name: string | null
  owner1_salary: number | null
  owner1_share: number | null       // e.g. 0.5 = 50%
  owner1_tax_rate: number | null    // marginal rate as decimal e.g. 0.37
  owner2_name: string | null
  owner2_salary: number | null
  owner2_share: number | null
  owner2_tax_rate: number | null
  medicare_levy: number | null      // e.g. 0.02
  property_status: string | null    // Pre-settlement | Pre-tenancy | Tenanted | Vacant
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

export interface RealEstateExpense {
  id: string
  user_id: string
  property_id: string
  date: string
  amount: number
  category: string
  description: string | null
  is_deductible: boolean
  receipt_url: string | null
  created_at: string
}

export interface RealEstateIncome {
  id: string
  user_id: string
  property_id: string
  date: string
  amount: number
  description: string | null
  created_at: string
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
