const BASIQ_API = 'https://au-api.basiq.io'

const AU_INSTITUTION_NAMES: Record<string, string> = {
  'AU00000': 'Commonwealth Bank',
  'AU00001': 'ANZ',
  'AU00002': 'Westpac',
  'AU00003': 'NAB',
  'AU00101': 'UBank',
  'AU00004': 'Macquarie',
  'AU00005': 'Bendigo Bank',
  'AU00006': 'ING',
  'AU00007': 'St George',
  'AU00008': 'Bank of Melbourne',
  'AU00009': 'BankSA',
  'AU00011': 'Suncorp',
  'AU00012': 'AMP',
  'AU00013': 'HSBC',
  'AU00014': 'Citibank',
}

const ACCOUNT_TYPE_MAP: Record<string, string> = {
  savings: 'savings',
  transaction: 'checking',
  'credit-card': 'credit',
  investment: 'investment',
  loan: 'checking',
  mortgage: 'checking',
}

export interface BasiqAccount {
  id: string
  name: string
  accountNo: string
  balance: number
  availableFunds: number
  currency: string
  institution: string
  connection: string
  class: { type: string; product: string }
  status: string
}

function basiqError(data: unknown, fallback: string): Error {
  if (typeof data === 'object' && data !== null) {
    const d = data as Record<string, unknown>
    const msg = d.detail ?? d.title ?? d.message ?? d.error
    if (msg) return new Error(`${fallback}: ${msg}`)
  }
  return new Error(`${fallback}: ${JSON.stringify(data)}`)
}

export async function getBasiqToken(): Promise<string> {
  const res = await fetch(`${BASIQ_API}/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${process.env.BASIQ_API_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'basiq-version': '3.0',
    },
    body: 'scope=SERVER_ACCESS',
  })
  const data = await res.json()
  if (!res.ok) throw basiqError(data, 'Basiq auth failed')
  return data.access_token
}

export async function createBasiqUser(token: string, email: string): Promise<string> {
  const res = await fetch(`${BASIQ_API}/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'basiq-version': '3.0',
    },
    body: JSON.stringify({ email }),
  })
  const data = await res.json()
  if (!res.ok) throw basiqError(data, 'Basiq user creation failed')
  return data.id
}

export async function getConsentUrl(token: string, basiqUserId: string, mobile: string): Promise<string> {
  const res = await fetch(`${BASIQ_API}/users/${basiqUserId}/auth_link`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'basiq-version': '3.0',
    },
    body: JSON.stringify({ mobile }),
  })
  const data = await res.json()
  if (!res.ok) throw basiqError(data, 'Failed to get consent URL')
  // v3 returns links.public; older SDK returns data
  const url = (data as Record<string, unknown>)?.links
    ? (data as { links: { public: string } }).links.public
    : (data as { data: { links: { public: string } } }).data?.links?.public
  if (!url) throw new Error(`Unexpected auth_link response: ${JSON.stringify(data)}`)
  return url
}

export async function fetchBasiqAccounts(token: string, basiqUserId: string): Promise<{ accounts: BasiqAccount[]; raw: unknown }> {
  const res = await fetch(`${BASIQ_API}/users/${basiqUserId}/accounts`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'basiq-version': '3.0',
    },
  })
  const data = await res.json()
  if (!res.ok) throw basiqError(data, 'Failed to fetch accounts')
  // Return all accounts regardless of status so we can debug
  return { accounts: data.data ?? [], raw: data }
}

export function mapBasiqAccount(a: BasiqAccount, userId: string) {
  return {
    user_id: userId,
    name: a.name,
    type: (ACCOUNT_TYPE_MAP[a.class?.type] ?? 'savings') as 'savings' | 'checking' | 'credit' | 'investment',
    institution: AU_INSTITUTION_NAMES[a.institution] ?? a.institution,
    currency: a.currency ?? 'AUD',
    balance: a.balance ?? 0,
    country: 'AU',
    is_active: true,
    basiq_account_id: a.id,
    basiq_connection_id: a.connection,
  }
}
