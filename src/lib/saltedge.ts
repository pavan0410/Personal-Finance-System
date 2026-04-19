const API = 'https://www.saltedge.com/api/v6'

function headers(customerSecret?: string): Record<string, string> {
  return {
    'App-id': process.env.SALTEDGE_APP_ID!,
    'Secret': process.env.SALTEDGE_SECRET!,
    'Content-Type': 'application/json',
    ...(customerSecret ? { 'Customer-secret': customerSecret } : {}),
  }
}

function saltedgeError(json: unknown, fallback: string): Error {
  if (typeof json === 'object' && json !== null) {
    const j = json as Record<string, unknown>
    const msg = (j.error as Record<string, unknown>)?.message ?? j.message
    if (msg) return new Error(`${fallback}: ${msg}`)
  }
  return new Error(`${fallback}: ${JSON.stringify(json)}`)
}

export interface SaltEdgeCustomer {
  id: string
  identifier: string
  secret: string
}

export interface SaltEdgeAccount {
  id: string
  connection_id: string
  name: string
  nature: string
  balance: number
  currency_code: string
  extra: { account_number?: string; account_name?: string }
}

export interface SaltEdgeConnection {
  id: string
  provider_name: string
  status: string
  country_code: string
}

const NATURE_MAP: Record<string, 'savings' | 'checking' | 'credit' | 'investment'> = {
  savings: 'savings',
  checking: 'checking',
  card: 'credit',
  credit_card: 'credit',
  investment: 'investment',
  bonus: 'savings',
  ewallet: 'savings',
  loan: 'checking',
  mortgage: 'checking',
  debit: 'checking',
  account: 'savings',
}

export async function createCustomer(identifier: string): Promise<SaltEdgeCustomer> {
  const res = await fetch(`${API}/customers`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ data: { identifier } }),
  })
  const json = await res.json()
  if (!res.ok) throw saltedgeError(json, 'Failed to create Salt Edge customer')
  return json.data
}

export async function createConnectSession(
  customerSecret: string,
  customerId: string,
  returnTo: string,
): Promise<string> {
  const fromDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const res = await fetch(`${API}/connect_sessions/create`, {
    method: 'POST',
    headers: headers(customerSecret),
    body: JSON.stringify({
      data: {
        customer_id: customerId,
        consent: {
          scopes: ['account_details', 'transactions_details'],
          from_date: fromDate,
        },
        attempt: {
          return_to: returnTo,
          fetch_scopes: ['accounts', 'transactions'],
        },
      },
    }),
  })
  const json = await res.json()
  if (!res.ok) throw saltedgeError(json, 'Failed to create connect session')
  return json.data.connect_url
}

export async function fetchConnections(customerSecret: string, customerId: string): Promise<SaltEdgeConnection[]> {
  const res = await fetch(`${API}/connections?customer_id=${customerId}`, {
    headers: headers(customerSecret),
  })
  const json = await res.json()
  if (!res.ok) throw saltedgeError(json, 'Failed to fetch connections')
  return json.data ?? []
}

export async function fetchAccounts(customerSecret: string, connectionId: string): Promise<SaltEdgeAccount[]> {
  const res = await fetch(`${API}/accounts?connection_id=${connectionId}`, {
    headers: headers(customerSecret),
  })
  const json = await res.json()
  if (!res.ok) throw saltedgeError(json, 'Failed to fetch accounts')
  return json.data ?? []
}

export function mapAccount(a: SaltEdgeAccount, userId: string, providerName: string) {
  return {
    user_id: userId,
    name: a.name,
    type: NATURE_MAP[a.nature] ?? 'savings',
    institution: providerName,
    currency: a.currency_code,
    balance: a.balance,
    country: 'AU',
    is_active: true,
    saltedge_account_id: a.id,
    saltedge_connection_id: a.connection_id,
  }
}
