// ── Category rules ────────────────────────────────────────────────────────────

export const CATEGORIES = [
  'Food', 'Transport', 'Utilities', 'Healthcare', 'Entertainment',
  'Shopping', 'Rent', 'Salary', 'Investment', 'Insurance', 'Transfer', 'Other',
]

const RULES: Array<{ keywords: string[]; category: string }> = [
  // Food & Dining
  { keywords: ['woolworths', 'coles', 'aldi', 'iga ', 'harris farm', 'foodworks', 'drakes', 'spudshed', 'costco'], category: 'Food' },
  { keywords: ['uber eats', 'ubereats', 'menulog', 'doordash', 'deliveroo', 'hey you', 'skip the dishes'], category: 'Food' },
  { keywords: ["mcdonald's", 'mcdonalds', 'kfc', 'subway', "domino's", 'dominoes', 'pizza hut', 'hungry jack', "nando's", 'red rooster', 'grill\'d'], category: 'Food' },
  { keywords: ['cafe', 'coffee', 'restaurant', 'bakery', 'sushi', 'thai food', 'chinese food', 'takeaway', 'takeout', 'dining'], category: 'Food' },
  { keywords: ['liquorland', 'dan murphy', 'bws ', 'first choice liquor', 'bottle shop'], category: 'Food' },

  // Transport & Fuel
  { keywords: ['uber ', '* uber', 'ola cab', 'didi ride', 'taxi', ' cab '], category: 'Transport' },
  { keywords: ['7-eleven', 'bp ', 'bp fuel', 'caltex', 'ampol', 'shell ', 'puma fuel', 'liberty fuel', 'petrol', 'servo fuel', 'fuel stop', 'united petro'], category: 'Transport' },
  { keywords: ['myki', 'opal card', 'go card', 'translink', 'metro train', 'ptv ', 'transport nsw', 'transport vic'], category: 'Transport' },
  { keywords: ['citylink', 'eastlink', 'linkt', 'e-toll', 'roam express', 'toll ', 'tunnel', 'parking', 'wilson parking', 'secure parking', 'care park'], category: 'Transport' },
  { keywords: ['qantas', 'jetstar', 'virgin australia', 'rex airline', 'tigerair', 'flight', 'airline', 'airport'], category: 'Transport' },

  // Utilities & Bills
  { keywords: ['origin energy', 'agl ', 'energy australia', 'red energy', 'simply energy', 'powershop', 'lumo energy'], category: 'Utilities' },
  { keywords: ['electricity', 'gas bill', 'water bill', 'yarra valley water', 'sydney water', 'sa water', 'icon water', 'urban utilities'], category: 'Utilities' },
  { keywords: ['telstra', 'optus', 'vodafone', 'tpg ', 'aussie broadband', 'superloop', 'belong', 'kogan mobile', 'amaysim', 'dodo', 'internode'], category: 'Utilities' },
  { keywords: ['council rate', 'strata levy', 'body corporate', 'rates notice', 'land tax'], category: 'Utilities' },
  { keywords: ['ubank home loan', 'mortgage repay', 'home loan repay', 'loan repay'], category: 'Utilities' },

  // Healthcare
  { keywords: ['chemist warehouse', 'priceline pharmacy', 'terry white', 'discount drug', 'pharma'], category: 'Healthcare' },
  { keywords: ['medical centre', 'medical clinic', 'gp ', ' doctor', 'dentist', 'optical', 'specsavers', 'opsm', 'hospital', 'pathology', 'radiology', 'physio', 'chiro'], category: 'Healthcare' },
  { keywords: ['medicare', 'dva ', 'ndis'], category: 'Healthcare' },

  // Insurance
  { keywords: ['bupa', 'medibank', 'ahm health', 'nib health', 'health insurance', 'health fund'], category: 'Insurance' },
  { keywords: ['allianz', 'gio ', 'suncorp', 'aami ', 'nrma', 'racv', 'rac ', 'ctp ', 'car insurance', 'home insurance', 'contents insurance', 'life insurance', 'income protection'], category: 'Insurance' },

  // Entertainment & Subscriptions
  { keywords: ['netflix', 'spotify', 'amazon prime', 'disney+', 'disney plus', 'apple tv', 'binge ', 'stan ', 'paramount+', 'youtube premium', 'apple one'], category: 'Entertainment' },
  { keywords: ['event cinemas', 'hoyts', 'village cinemas', 'reading cinemas', 'imax'], category: 'Entertainment' },
  { keywords: ['steam ', 'playstation', 'xbox ', 'nintendo', 'epic games', 'apple arcade', 'google play'], category: 'Entertainment' },
  { keywords: ['gym', 'fitness', 'anytime fitness', 'goodlife', 'snap fitness', 'f45', 'crossfit', 'yoga'], category: 'Entertainment' },

  // Shopping
  { keywords: ['amazon ', 'amazon.com', 'amazon.au', 'ebay ', 'ebay.com'], category: 'Shopping' },
  { keywords: ['kmart', 'target ', 'big w', 'myer ', 'david jones', 'jb hi-fi', 'jbhifi', 'harvey norman', 'the good guys'], category: 'Shopping' },
  { keywords: ['ikea', 'bunnings', 'mitre 10', 'officeworks', 'apple store', 'apple.com/au', 'samsung'], category: 'Shopping' },
  { keywords: ['uniqlo', 'zara', 'h&m', 'cotton on', 'country road', 'glue store', 'the iconic', 'asos'], category: 'Shopping' },

  // Rent
  { keywords: ['rent payment', 'rental bond', ' rent ', 'landlord', 'real estate agent', 'property management', 'harcourts', 'ray white', 'barry plant', 'century 21', 'lj hooker'], category: 'Rent' },

  // Salary & Income
  { keywords: ['salary', 'payroll', 'wages credit', 'pay credit', 'employer payment', 'ato refund', 'tax refund', 'centrelink', 'interest earned', 'dividend', 'cashback'], category: 'Salary' },

  // Investment
  { keywords: ['vanguard', 'commsec', 'stake ', 'pearler', 'selfwealth', 'superhero invest', 'raiz invest', 'spaceship invest', 'betashares', 'ishares', 'asx brokerage'], category: 'Investment' },
  { keywords: ['bpay ref', 'bpay payment'], category: 'Transfer' },

  // Transfer
  { keywords: ['transfer to', 'transfer from', 'osko payment', 'pay anyone', 'payment to ', 'payment from ', 'internal transfer', 'sweep to', 'sweep from'], category: 'Transfer' },
]

export function categorise(description: string): string {
  const lower = description.toLowerCase()
  for (const rule of RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) return rule.category
  }
  return 'Other'
}

// ── CSV parsing ───────────────────────────────────────────────────────────────

export interface ParsedTransaction {
  date: string        // YYYY-MM-DD
  description: string
  amount: number      // positive = income, negative = expense
  type: 'income' | 'expense' | 'transfer'
  category: string
  balance?: number
}

function parseAusDate(raw: string): string {
  const clean = raw.trim()
  // DD/MM/YYYY
  const m1 = clean.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (m1) return `${m1[3]}-${m1[2]}-${m1[1]}`
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean
  return clean
}

function parseMoney(raw: string): number {
  if (!raw) return 0
  return parseFloat(raw.replace(/[$,\s]/g, '')) || 0
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let cur = '', inQ = false
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ }
    else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = '' }
    else cur += ch
  }
  result.push(cur.trim())
  return result
}

// CommBank: Date, Amount, Description, Balance
function parseCommbank(rows: string[][]): ParsedTransaction[] {
  return rows
    .filter(r => r.length >= 3 && r[0]?.trim() && r[0].trim() !== 'Date')
    .map(r => {
      const amount = parseMoney(r[1])
      const description = r[2]?.trim() ?? ''
      const category = categorise(description)
      const type: ParsedTransaction['type'] =
        category === 'Transfer' ? 'transfer' : amount >= 0 ? 'income' : 'expense'
      return { date: parseAusDate(r[0]), description, amount, type, category, balance: r[3] ? parseMoney(r[3]) : undefined }
    })
    .filter(t => t.date && t.description)
}

// UBank: Date, Description, Debit, Credit, Balance  (or similar)
function parseUbank(rows: string[][], headers: string[]): ParsedTransaction[] {
  const h = headers.map(s => s.toLowerCase().trim())
  const descIdx = h.findIndex(s => s.includes('description') || s.includes('details') || s.includes('narrative'))
  const debitIdx = h.findIndex(s => s === 'debit' || s === 'debit amount' || s.includes('withdrawal'))
  const creditIdx = h.findIndex(s => s === 'credit' || s === 'credit amount' || s.includes('deposit'))
  const balIdx = h.findIndex(s => s.includes('balance'))

  return rows
    .filter(r => r.length >= 3 && r[0]?.trim())
    .map(r => {
      const debit = debitIdx >= 0 ? parseMoney(r[debitIdx] ?? '') : 0
      const credit = creditIdx >= 0 ? parseMoney(r[creditIdx] ?? '') : 0
      const amount = credit > 0 ? credit : debit > 0 ? -debit : 0
      const description = (descIdx >= 0 ? r[descIdx] : r[1])?.trim() ?? ''
      const category = categorise(description)
      const type: ParsedTransaction['type'] =
        category === 'Transfer' ? 'transfer' : amount >= 0 ? 'income' : 'expense'
      return {
        date: parseAusDate(r[0]),
        description,
        amount,
        type,
        category,
        balance: balIdx >= 0 ? parseMoney(r[balIdx] ?? '') : undefined,
      }
    })
    .filter(t => t.date && t.description)
}

type Bank = 'commbank' | 'ubank' | 'unknown'

function detectBank(headers: string[]): Bank {
  const h = headers.map(s => s.toLowerCase().trim())
  // CommBank export has exactly: Date, Amount, Description, Balance (4 cols or fewer)
  if (h.includes('amount') && h.includes('description') && !h.includes('debit') && !h.includes('credit')) return 'commbank'
  // UBank has separate debit/credit columns
  if (h.includes('debit') || h.includes('debit amount') || h.includes('withdrawal')) return 'ubank'
  return 'unknown'
}

export function parseCSV(text: string): { bank: Bank; transactions: ParsedTransaction[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return { bank: 'unknown', transactions: [] }

  const headers = parseCSVLine(lines[0])
  const bank = detectBank(headers)
  const rows = lines.slice(1).map(parseCSVLine)

  const transactions = bank === 'ubank'
    ? parseUbank(rows, headers)
    : parseCommbank(rows)  // default → CommBank format

  return { bank: bank === 'unknown' ? 'commbank' : bank, transactions }
}
