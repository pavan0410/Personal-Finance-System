-- ============================================================
-- WealthLens — Supabase Schema
-- Run this in your Supabase SQL editor at:
-- https://supabase.com/dashboard/project/<your-project>/sql
-- ============================================================

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  base_currency TEXT DEFAULT 'AUD',
  timezone TEXT DEFAULT 'Australia/Sydney',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bank / savings accounts
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('savings','checking','credit','investment')),
  institution TEXT,
  currency TEXT NOT NULL DEFAULT 'AUD',
  balance DECIMAL(15,2) DEFAULT 0,
  country TEXT NOT NULL DEFAULT 'AU',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AUD',
  type TEXT NOT NULL CHECK (type IN ('income','expense','transfer')),
  category TEXT,
  subcategory TEXT,
  payment_method TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indian Mutual Fund holdings (NAV stored in INR)
CREATE TABLE IF NOT EXISTS mutual_fund_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scheme_code TEXT,
  isin TEXT,
  scheme_name TEXT NOT NULL,
  fund_house TEXT,
  category TEXT,
  sub_category TEXT,
  units DECIMAL(12,4) NOT NULL,
  avg_purchase_nav DECIMAL(12,4),
  current_nav DECIMAL(12,4),
  nav_date DATE,
  cost_basis_inr DECIMAL(15,2),
  current_value_inr DECIMAL(15,2),
  current_value_aud DECIMAL(15,2),
  inr_aud_rate DECIMAL(10,6),
  sip_active BOOLEAN DEFAULT false,
  sip_amount DECIMAL(12,2),
  sip_date INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ETF holdings (AUD primary)
CREATE TABLE IF NOT EXISTS etf_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  exchange TEXT NOT NULL CHECK (exchange IN ('ASX','NYSE','NASDAQ','OTHER')),
  name TEXT NOT NULL,
  shares DECIMAL(12,4) NOT NULL,
  avg_purchase_price DECIMAL(12,4),
  current_price DECIMAL(12,4),
  price_updated_at TIMESTAMPTZ,
  currency TEXT NOT NULL DEFAULT 'AUD',
  cost_basis DECIMAL(15,2),
  current_value_aud DECIMAL(15,2),
  sector TEXT,
  asset_class TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Superannuation
CREATE TABLE IF NOT EXISTS superannuation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  fund_name TEXT NOT NULL,
  member_number TEXT,
  investment_option TEXT,
  balance DECIMAL(15,2),
  employer_contributions_ytd DECIMAL(15,2) DEFAULT 0,
  personal_contributions_ytd DECIMAL(15,2) DEFAULT 0,
  balance_date DATE,
  insurance_death_cover DECIMAL(15,2),
  insurance_tpd_cover DECIMAL(15,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Real estate properties
CREATE TABLE IF NOT EXISTS real_estate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  property_type TEXT CHECK (property_type IN ('residential','commercial','land')),
  country TEXT NOT NULL DEFAULT 'AU',
  currency TEXT NOT NULL DEFAULT 'AUD',
  purchase_price DECIMAL(15,2),
  purchase_date DATE,
  current_valuation DECIMAL(15,2),
  valuation_date DATE,
  loan_outstanding DECIMAL(15,2) DEFAULT 0,
  loan_rate DECIMAL(5,2),
  rental_income_monthly DECIMAL(12,2),
  expenses_monthly DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Financial goals
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,
  target_date DATE,
  currency TEXT NOT NULL DEFAULT 'AUD',
  priority TEXT CHECK (priority IN ('low','medium','high')),
  linked_asset_ids UUID[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Exchange rates cache
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate DECIMAL(12,6) NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(from_currency, to_currency)
);

-- AI insights cache
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  content TEXT NOT NULL,
  data_snapshot JSONB,
  generated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutual_fund_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE etf_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE superannuation ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_estate ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_own" ON profiles USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Accounts
CREATE POLICY "accounts_own" ON accounts USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Transactions
CREATE POLICY "transactions_own" ON transactions USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Mutual funds
CREATE POLICY "mf_own" ON mutual_fund_holdings USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ETFs
CREATE POLICY "etf_own" ON etf_holdings USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Superannuation
CREATE POLICY "super_own" ON superannuation USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Real estate
CREATE POLICY "re_own" ON real_estate USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Goals
CREATE POLICY "goals_own" ON goals USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Exchange rates (readable by all authenticated users)
CREATE POLICY "rates_read" ON exchange_rates FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "rates_write" ON exchange_rates FOR ALL USING (auth.uid() IS NOT NULL);

-- AI insights
CREATE POLICY "insights_own" ON ai_insights USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- Auto-create profile on signup trigger
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
