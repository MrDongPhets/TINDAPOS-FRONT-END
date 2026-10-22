// VAT rules on the POS, same as the backend's services/vatService.ts (Invoicing plan P0-5).
// The company's BIR VAT status comes from GET /pos/stores (vat_status) and is cached in companyData for offline use.
import type { VatStatus } from '@/lib/invoice'

export const normalizeVatStatus = (v: unknown): VatStatus => (v === 'non_vat' || v === 'rbe' ? v : 'vat')

const r2 = (n: number) => Math.round(n * 100) / 100

// Senior citizen / PWD (RA 9994 / RA 7277): VAT sellers remove VAT then give 20% off;
// non-VAT sellers have no VAT in their prices, so it's simply 20% off
export const scPwdDiscount = (subtotal: number, vatStatus: VatStatus) =>
  vatStatus === 'non_vat' ? r2(subtotal * 0.2) : r2(subtotal - (subtotal / 1.12) * 0.8)
