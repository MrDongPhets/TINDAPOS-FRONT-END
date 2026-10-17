// src/lib/finance.ts — GCash fee math + expense labels
// Fee math mirrors TindaPos-Backend/src/services/gcashFeeService.ts (the backend is the source of truth).

export type GcashType = 'cash_in' | 'cash_out'

export type FeeRule = {
  mode: 'bracket' | 'percent'
  bracket_amount: number
  bracket_fee: number
  percent: number
  minimum_fee: number
}

export type GcashSettings = { cash_in: FeeRule; cash_out: FeeRule }

export const DEFAULT_FEE_RULE: FeeRule = { mode: 'bracket', bracket_amount: 500, bracket_fee: 10, percent: 2, minimum_fee: 10 }

export function computeGcashFee(amount: number, rule: FeeRule): number {
  if (!(amount > 0)) return 0
  const fee = rule.mode === 'percent'
    ? Math.max(rule.minimum_fee, (amount * rule.percent) / 100)
    : Math.ceil(amount / rule.bracket_amount) * rule.bracket_fee
  return Math.round(fee * 100) / 100
}

export const describeFeeRule = (rule: FeeRule) =>
  rule.mode === 'percent'
    ? `${rule.percent}% (min ₱${rule.minimum_fee})`
    : `₱${rule.bracket_fee} per ₱${rule.bracket_amount}`

export const GCASH_TYPE_LABELS: Record<GcashType, { label: string; hint: string }> = {
  cash_in: { label: 'Cash-In', hint: 'Customer gives cash → you send GCash' },
  cash_out: { label: 'Cash-Out', hint: 'Customer sends GCash → you give cash' },
}

export const EXPENSE_CATEGORIES = [
  { value: 'rent', label: 'Upa (Rent)' },
  { value: 'electricity', label: 'Kuryente (Electricity)' },
  { value: 'water', label: 'Tubig (Water)' },
  { value: 'internet', label: 'Internet / Load' },
  { value: 'salary', label: 'Sahod (Salary)' },
  { value: 'supplies', label: 'Supplies (ice, plastic, etc.)' },
  { value: 'transportation', label: 'Pamasahe / Delivery' },
  { value: 'maintenance', label: 'Repair / Maintenance' },
  { value: 'taxes', label: 'Buwis / Permits' },
  { value: 'other', label: 'Iba pa (Other)' },
] as const

export const EXPENSE_PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'gcash', label: 'GCash' },
  { value: 'bank', label: 'Bank' },
  { value: 'other', label: 'Other' },
] as const

export const expenseCategoryLabel = (value: string) =>
  EXPENSE_CATEGORIES.find(c => c.value === value)?.label ?? value

// Local (Philippine) date as YYYY-MM-DD
export const localDate = (d = new Date()) => d.toLocaleDateString('en-CA')

// Date range presets → { start, end } as local YYYY-MM-DD
export type RangePreset = 'today' | '7d' | 'month' | 'all'

export const RANGE_PRESETS: { value: RangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: 'month', label: 'This month' },
  { value: 'all', label: 'All time' },
]

export function rangeFor(preset: RangePreset): { start?: string; end?: string } {
  const today = new Date()
  if (preset === 'all') return {}
  if (preset === 'today') return { start: localDate(today), end: localDate(today) }
  if (preset === '7d') {
    const start = new Date(today)
    start.setDate(start.getDate() - 6)
    return { start: localDate(start), end: localDate(today) }
  }
  return { start: localDate(new Date(today.getFullYear(), today.getMonth(), 1)), end: localDate(today) }
}

// Local day bounds as ISO timestamps (for created_at filters)
export const dayStartIso = (date: string) => new Date(`${date}T00:00:00`).toISOString()
export const dayEndIso = (date: string) => new Date(`${date}T23:59:59.999`).toISOString()
