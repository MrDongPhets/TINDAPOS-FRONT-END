import type { SaleEinvoice } from '@/lib/invoice'

// Voids / returns (Invoicing plan P0-6/7) — shapes from GET /client/sales/:id and POST /client/sales/:id/adjustments
export type AdjustmentKind = 'void' | 'return'
export type SaleAdjustmentStatus = 'voided' | 'returned' | 'partially_returned' | null

export interface SaleAdjustmentLine { sales_item_id: string; product_id: string; name: string; quantity: number; unit_price: number; amount: number }
export interface SaleAdjustment {
  id: string
  adjustment_no: string
  kind: AdjustmentKind
  correction_code: string
  total_amount: number | string
  tax_amount?: number | string
  items: SaleAdjustmentLine[]
  reason: string
  created_at: string
  // E-invoice stores: the TaxTrail correction (cancellation / credit memo) — Invoicing plan P2-7
  einvoice?: (SaleEinvoice & { kind: string }) | null
}

// BIR correction codes (EIS) — what the owner picks
export const CORRECTION_REASONS: Array<{ code: string; label: string }> = [
  { code: '04', label: 'Cancelled / refunded (no replacement)' },
  { code: '05', label: 'Returned for replacement' },
  { code: '01', label: 'Wrong entry (cashier error)' },
  { code: '09', label: 'Other' },
]
export const correctionLabel = (code: string) => CORRECTION_REASONS.find(r => r.code === code)?.label || code

export const ADJUSTMENT_STATUS_LABEL: Record<string, string> = {
  voided: 'VOIDED',
  returned: 'RETURNED',
  partially_returned: 'PART RETURNED',
}

// One line for the TaxTrail side of a void / return
export function correctionStatusText(e: SaleAdjustment['einvoice']): { text: string; tone: 'ok' | 'wait' | 'bad' } | null {
  if (!e) return null
  const memo = e.kind === 'credit_memo'
  if (['issued', 'accepted'].includes(e.status)) {
    return { text: memo ? `E-invoice credit memo ${e.invoice_no}${e.status === 'accepted' ? ' · accepted by BIR' : ''}` : 'E-invoice cancelled on TaxTrail', tone: 'ok' }
  }
  if (e.status === 'pending') return { text: `Sending the ${memo ? 'credit memo' : 'cancellation'} to TaxTrail…`, tone: 'wait' }
  if (e.status === 'rejected') return { text: 'BIR rejected the credit memo — contact support', tone: 'bad' }
  return { text: e.message || 'TaxTrail did not accept this correction — contact support', tone: 'bad' }
}

// Sales from before P0-6 marked a void only in the notes
export function saleAdjustmentStatus(sale: { adjustment_status?: string | null; notes?: string | null }): SaleAdjustmentStatus {
  if (sale.adjustment_status) return sale.adjustment_status as SaleAdjustmentStatus
  return sale.notes?.includes('VOIDED:') ? 'voided' : null
}

// Quantity of each sale item still returnable
export function remainingQuantities(items: Array<{ id: string; quantity: number | string }>, adjustments: SaleAdjustment[]): Record<string, number> {
  const back: Record<string, number> = {}
  for (const a of adjustments) for (const l of a.items || []) back[l.sales_item_id] = (back[l.sales_item_id] || 0) + Number(l.quantity)
  return Object.fromEntries(items.map(i => [i.id, Math.max(0, Math.round((Number(i.quantity) - (back[i.id] || 0)) * 10_000) / 10_000)]))
}
