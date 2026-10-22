// VAT rules on the POS, same as the backend's services/vatService.ts (Invoicing plan P0-5 / P2-5).
// The company's BIR VAT status comes from GET /pos/stores (vat_status) and is cached in companyData for offline use.
import type { VatStatus } from '@/lib/invoice'

export const normalizeVatStatus = (v: unknown): VatStatus => (v === 'non_vat' || v === 'rbe' ? v : 'vat')

export interface SpecialDiscountLine { price: number; quantity: number; vatType?: string | null }

const divRound = (n: number, d: number) => Math.floor((n * 2 + d) / (2 * d))

// Senior citizen / PWD discount, item by item (RA 9994 / RA 7277) — same rule and centavo rounding as the
// backend and TaxTrail, so the cart, the saved sale and the e-invoice all agree:
//  - VATable item (VAT seller): VAT out of the price first (× 100/112), then 20% off
//  - VAT-exempt / zero-rated item, or any item of a non-VAT seller: 20% off the price as is
export function specialDiscountTotals(lines: SpecialDiscountLine[], vatStatus: VatStatus, ratePercent = 20) {
  let grossC = 0
  let totalC = 0
  for (const l of lines) {
    const qty4 = Math.round(Number(l.quantity) * 10_000)
    const priceC = Math.round(Number(l.price) * 100)
    grossC += divRound(qty4 * priceC, 10_000)
    const vatable = (l.vatType || 'vatable') === 'vatable' && vatStatus !== 'non_vat'
    const base = vatable ? divRound(priceC * 100, 112) : priceC
    const extended = divRound(qty4 * base, 10_000)
    totalC += extended - divRound(extended * ratePercent, 100)
  }
  return { gross: grossC / 100, discount: (grossC - totalC) / 100, total: totalC / 100 }
}
