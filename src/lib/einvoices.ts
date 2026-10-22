// E-invoice status list (Invoicing plan P2-8) — shape of GET /client/einvoices
export type EinvoiceStatus = 'pending' | 'issued' | 'accepted' | 'rejected' | 'dead_letter' | 'invalid' | 'config_error'
export type EinvoiceFilter = 'attention' | 'pending' | 'all'

export interface EinvoiceListItem {
  id: string
  kind: 'invoice' | 'credit_memo' | 'cancellation' | string
  status: EinvoiceStatus
  sale_id: string
  or_number: string | null
  adjustment_no: string | null
  esp_invoice_no: string | null
  attempts: number
  last_error: string | null
  rejection_code: string | null
  issued_at: string | null
  created_at: string
  next_attempt_at: string | null
  message: string | null
}

export interface EinvoiceList {
  items: EinvoiceListItem[]
  counts: Record<string, number>
  attention: number
  pending: number
}

export const EINVOICE_STATUS: Record<EinvoiceStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800' },
  issued: { label: 'Issued', className: 'bg-blue-100 text-blue-800' },
  accepted: { label: 'Accepted by BIR', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected by BIR', className: 'bg-red-100 text-red-800' },
  dead_letter: { label: 'Gave up', className: 'bg-red-100 text-red-800' },
  invalid: { label: 'Refused', className: 'bg-red-100 text-red-800' },
  config_error: { label: 'Connection problem', className: 'bg-red-100 text-red-800' },
}

export const EINVOICE_KIND: Record<string, string> = { invoice: 'Invoice', credit_memo: 'Credit memo', cancellation: 'Cancellation' }

// What the owner can do about it
export const canRetry = (s: EinvoiceStatus) => s === 'pending' || s === 'invalid' || s === 'dead_letter' || s === 'config_error'
