// Invoice content shared by the POS receipt, Print, Download, Email and the sale-detail reprint (Invoicing plan P0-4).
// RR 7-2024 / EOPT: the main sales document is the INVOICE. A store whose POS is BIR-registered (PTU set in
// Settings → BIR & Invoicing) prints "INVOICE" with its PTU / MIN / serial no.; otherwise the slip is a
// "SALES RECEIPT" and says it isn't a BIR-registered invoice — Tindapo must never claim a registration it doesn't have.
import { formatCurrency } from '@/lib/utils'

export type VatStatus = 'vat' | 'non_vat' | 'rbe'

export interface InvoiceSeller {
  registered_name: string
  trade_name: string | null
  address: string | null
  tin: string | null
  branch_code: string
  vat_status: VatStatus
  ptu_number: string | null
  min_number: string | null
  msn_number: string | null
  store_name: string | null
  store_phone: string | null
}

export interface InvoiceItem {
  name: string
  quantity: number
  unitPrice: number
  discount: number
}

export interface InvoiceSale {
  or_number?: string | null
  receipt_number?: string | null
  created_at?: string
  customer_name?: string | null
  payment_method?: string | null
  subtotal?: number | string | null
  discount_amount?: number | string | null
  discount_type?: string | null
  total_amount?: number | string | null
  vatable_amount?: number | string | null
  vat_exempt_amount?: number | string | null
  zero_rated_amount?: number | string | null
  tax_amount?: number | string | null
}

type StoreLike = { name?: string; address?: string | null; phone?: string | null; branch_code?: string | null; ptu_number?: string | null; min_number?: string | null; msn_number?: string | null } | null | undefined
type CompanyLike = Record<string, unknown>

const num = (v: unknown) => parseFloat(String(v ?? 0)) || 0
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v : null)

// Server-provided seller details win; otherwise build them from the cached company + selected store (offline sales)
export function resolveSeller(server: InvoiceSeller | null | undefined, store: StoreLike, company: CompanyLike): InvoiceSeller {
  if (server) return server
  const vat = company.vat_status === 'non_vat' || company.vat_status === 'rbe' ? company.vat_status : 'vat'
  return {
    registered_name: str(company.bir_registered_name) || str(company.name) || store?.name || 'Store',
    trade_name: str(company.bir_trade_name),
    address: str(company.bir_registered_address) || store?.address || str(company.address),
    tin: str(company.tin),
    branch_code: store?.branch_code || '00000',
    vat_status: vat,
    ptu_number: store?.ptu_number || null,
    min_number: store?.min_number || null,
    msn_number: store?.msn_number || null,
    store_name: store?.name || null,
    store_phone: store?.phone || null,
  }
}

export const readCachedCompany = (): CompanyLike => {
  try { return JSON.parse(localStorage.getItem('companyData') || '{}') } catch { return {} }
}

export function invoiceKind(seller: InvoiceSeller) {
  const registered = !!seller.ptu_number
  return registered
    ? { registered, title: 'INVOICE', numberLabel: 'Invoice No.' }
    : { registered, title: 'SALES RECEIPT', numberLabel: 'Receipt No.' }
}

// "123456789" + "00000" → "123-456-789-00000"
export function formatTinBranch(tin: string | null, branch: string) {
  if (!tin) return null
  const t = /^\d{9}$/.test(tin) ? `${tin.slice(0, 3)}-${tin.slice(3, 6)}-${tin.slice(6)}` : tin
  return `${t}-${branch || '00000'}`
}

export const tinLabel = (vat: VatStatus) => (vat === 'non_vat' ? 'NON-VAT Reg. TIN' : vat === 'vat' ? 'VAT Reg. TIN' : 'TIN')

export const discountLabel = (type: string | null | undefined) =>
  type === 'senior_citizen' ? 'Senior Citizen Disc.' : type === 'pwd' ? 'PWD Discount' : 'Discount'

export interface InvoiceAmountRow { label: string; amount: number; strong?: boolean }

// VAT breakdown — only for VAT-registered sellers (non-VAT invoices show no VAT)
export function vatRows(sale: InvoiceSale, seller: InvoiceSeller): InvoiceAmountRow[] {
  if (seller.vat_status === 'non_vat') return []
  const vatable = num(sale.vatable_amount)
  const exempt = num(sale.vat_exempt_amount)
  const zero = num(sale.zero_rated_amount)
  const vat = num(sale.tax_amount)
  const rows: InvoiceAmountRow[] = []
  if (vatable > 0) rows.push({ label: 'VATable Sales', amount: vatable - vat })
  if (exempt > 0) rows.push({ label: 'VAT-Exempt Sales', amount: exempt })
  if (zero > 0) rows.push({ label: 'Zero-Rated Sales', amount: zero })
  if (vat > 0) rows.push({ label: 'VAT (12%)', amount: vat, strong: true })
  return rows
}

export function footerNotes(seller: InvoiceSeller): string[] {
  const notes: string[] = []
  if (seller.vat_status === 'non_vat') notes.push('THIS DOCUMENT IS NOT VALID FOR CLAIM OF INPUT TAX.')
  if (!invoiceKind(seller).registered) notes.push('This is not a BIR-registered invoice.')
  return notes
}

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
const peso = (n: number) => `₱${n.toFixed(2)}`

export const invoiceNumber = (sale: InvoiceSale) => sale.or_number || sale.receipt_number || ''

export const formatInvoiceDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Manila' }) : ''

// One printable invoice (80 mm thermal width) used by Print and Download
export function buildInvoiceHtml(opts: { sale: InvoiceSale; items: InvoiceItem[]; seller: InvoiceSeller; staffName?: string | null }): string {
  const { sale, items, seller, staffName } = opts
  const kind = invoiceKind(seller)
  const tinLine = formatTinBranch(seller.tin, seller.branch_code)
  const discount = num(sale.discount_amount)
  const itemsHtml = items.map(it => `
      <tr>
        <td style="padding:3px 0">${esc(it.name)}<br/><span class="muted">${it.quantity} × ${peso(it.unitPrice)}${it.discount > 0 ? ` (-${peso(it.discount)})` : ''}</span></td>
        <td style="text-align:right;padding:3px 0;vertical-align:top">${peso(it.unitPrice * it.quantity - it.discount)}</td>
      </tr>`).join('')
  const vatHtml = vatRows(sale, seller).map(r => `<div class="row${r.strong ? ' bold' : ''}"><span>${r.label}:</span><span>${peso(r.amount)}</span></div>`).join('')
  const machine = [seller.ptu_number && `PTU No.: ${esc(seller.ptu_number)}`, seller.min_number && `MIN: ${esc(seller.min_number)}`, seller.msn_number && `SN: ${esc(seller.msn_number)}`].filter(Boolean)

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${kind.title} ${esc(invoiceNumber(sale))}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Courier New',monospace; font-size:12px; width:300px; margin:0 auto; padding:16px; }
    .center { text-align:center; }
    .divider { border-top:1px dashed #000; margin:8px 0; }
    .bold { font-weight:bold; }
    .large { font-size:14px; }
    .muted { font-size:10px; color:#555; }
    .row { display:flex; justify-content:space-between; padding:2px 0; }
    table { width:100%; border-collapse:collapse; }
    .total-row td { font-weight:bold; font-size:14px; border-top:1px dashed #000; padding-top:6px; }
    .footer { margin-top:10px; text-align:center; font-size:11px; }
    @media print { @page { margin:0; size:80mm auto; } }
  </style>
</head>
<body>
  <div class="center">
    <div class="bold large">${esc(seller.trade_name || seller.store_name || seller.registered_name)}</div>
    ${seller.trade_name || seller.store_name ? `<div>${esc(seller.registered_name)}</div>` : ''}
    ${seller.address ? `<div>${esc(seller.address)}</div>` : ''}
    ${tinLine ? `<div>${tinLabel(seller.vat_status)}: ${esc(tinLine)}</div>` : ''}
    ${seller.store_phone ? `<div>${esc(seller.store_phone)}</div>` : ''}
  </div>
  <div class="divider"></div>
  <div class="bold center large">${kind.title}</div>
  <div class="divider"></div>
  <div class="row"><span>${kind.numberLabel}</span><span>${esc(invoiceNumber(sale))}</span></div>
  <div class="row"><span>Date:</span><span>${esc(formatInvoiceDate(sale.created_at))}</span></div>
  ${sale.customer_name ? `<div class="row"><span>Customer:</span><span>${esc(sale.customer_name)}</span></div>` : ''}
  ${staffName ? `<div class="row"><span>Cashier:</span><span>${esc(staffName)}</span></div>` : ''}
  <div class="divider"></div>
  <table><tbody>${itemsHtml}</tbody>
    <tfoot>
      ${discount > 0 ? `<tr><td>${discountLabel(sale.discount_type)}</td><td style="text-align:right">-${peso(discount)}</td></tr>` : ''}
      <tr class="total-row"><td>TOTAL</td><td style="text-align:right">${peso(num(sale.total_amount))}</td></tr>
    </tfoot>
  </table>
  <div style="margin-top:6px">Payment: ${esc((sale.payment_method || 'cash').replace('_', ' ').toUpperCase())}</div>
  ${vatHtml ? `<div class="divider"></div>${vatHtml}` : ''}
  ${machine.length ? `<div class="divider"></div><div class="muted">${machine.join('<br/>')}</div>` : ''}
  <div class="divider"></div>
  <div class="footer">
    ${footerNotes(seller).map(n => `<div class="bold" style="margin-bottom:4px">${n}</div>`).join('')}
    <div>Thank you for your purchase!</div>
  </div>
</body>
</html>`
}

export function printInvoice(html: string) {
  const w = window.open('', '_blank', 'width=400,height=600')
  if (!w) return
  w.document.write(html)
  w.document.close()
  w.focus()
  w.print()
  w.close()
}

export function downloadInvoice(html: string, sale: InvoiceSale, seller: InvoiceSeller) {
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${invoiceKind(seller).registered ? 'invoice' : 'receipt'}-${invoiceNumber(sale)}.html`
  a.click()
  URL.revokeObjectURL(url)
}

export function emailInvoice(sale: InvoiceSale, seller: InvoiceSeller) {
  const kind = invoiceKind(seller)
  const lines = [
    kind.title,
    '',
    `${kind.numberLabel} ${invoiceNumber(sale)}`,
    `Store: ${seller.trade_name || seller.store_name || seller.registered_name}`,
    `Date: ${formatInvoiceDate(sale.created_at)}`,
    '',
    `Total: ${formatCurrency(num(sale.total_amount))}`,
    `Payment: ${(sale.payment_method || 'cash').replace('_', ' ')}`,
    ...footerNotes(seller).map(n => `\n${n}`),
    '',
    'Thank you for your purchase!',
  ]
  window.open(`mailto:?subject=${encodeURIComponent(`${kind.title} ${invoiceNumber(sale)}`)}&body=${encodeURIComponent(lines.join('\n'))}`)
}
