// src/config/pricing.ts — plan prices per billing period (single source of truth for the UI)
// Payment is still manual (GCash/Maya/bank → message us on Facebook → admin activates for N months).

export type PaidPlanId = 'negosyo' | 'laking-negosyo'
export type BillingMonths = 1 | 6 | 12

export const BILLING_PERIODS: BillingMonths[] = [1, 6, 12]
export const BEST_VALUE_MONTHS: BillingMonths = 12

// Total price in pesos for the whole period
export const PLAN_PRICES: Record<PaidPlanId, Record<BillingMonths, number>> = {
  'negosyo':        { 1: 299, 6: 1499, 12: 2699 },
  'laking-negosyo': { 1: 599, 6: 2999, 12: 5399 },
}

export const PLAN_LABELS: Record<PaidPlanId, string> = {
  'negosyo': 'Negosyo',
  'laking-negosyo': 'Laking Negosyo',
}

// Accepts the different spellings used around the app ('laking_negosyo', 'laking-negosyo')
export const toPaidPlanId = (plan?: string | null): PaidPlanId =>
  plan?.replace('_', '-') === 'laking-negosyo' ? 'laking-negosyo' : 'negosyo'

export const periodLabel = (months: BillingMonths) => (months === 1 ? '1 month' : `${months} months`)

export function getPrice(plan: PaidPlanId, months: BillingMonths) {
  const total = PLAN_PRICES[plan][months]
  const monthly = PLAN_PRICES[plan][1]
  return {
    total,
    perMonth: Math.round(total / months),
    savings: monthly * months - total,
    savingsPercent: Math.round((1 - total / (monthly * months)) * 100),
  }
}

export const peso = (n: number) => `₱${n.toLocaleString('en-PH')}`
