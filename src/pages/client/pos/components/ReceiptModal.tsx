'use client'

import { Printer, Download, Mail, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'
import {
  buildInvoiceHtml, discountLabel, specialDiscountRows, downloadInvoice, emailInvoice, footerNotes, formatInvoiceDate, formatTinBranch,
  einvoiceRows, invoiceKind, invoiceNumber, printInvoice, readCachedCompany, resolveSeller, tinLabel, vatRows,
  type InvoiceItem, type InvoiceSeller,
} from '@/lib/invoice'

export default function ReceiptModal({ open, onClose, sale, store, onNewSale, cartItems = [] }) {
  if (!sale) return null

  // Seller details come with the sale from the server; offline sales fall back to cached company + store
  const seller: InvoiceSeller = resolveSeller(sale.seller, store, readCachedCompany())
  const kind = invoiceKind(seller, sale)
  const tinLine = formatTinBranch(seller.tin, seller.branch_code)
  const items: InvoiceItem[] = cartItems.map(item => ({
    name: item.name, quantity: item.quantity, unitPrice: Number(item.price), discount: Number(item.discount_amount || 0),
  }))
  const vat = vatRows(sale, seller)
  const notes = footerNotes(seller, sale)
  const html = () => buildInvoiceHtml({ sale, items, seller })
  const machine = [
    seller.ptu_number && `PTU No.: ${seller.ptu_number}`,
    seller.min_number && `MIN: ${seller.min_number}`,
    seller.msn_number && `SN: ${seller.msn_number}`,
  ].filter(Boolean)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            Sale Completed! 🎉
          </DialogTitle>
        </DialogHeader>

        {/* Invoice preview */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 print:border-0">
          {/* Seller (BIR registration) */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold">{seller.trade_name || seller.store_name || seller.registered_name}</h2>
            {(seller.trade_name || seller.store_name) && <p className="text-sm text-gray-700">{seller.registered_name}</p>}
            {seller.address && <p className="text-sm text-gray-600 mt-1">{seller.address}</p>}
            {tinLine && <p className="text-sm text-gray-600">{tinLabel(seller.vat_status)}: {tinLine}</p>}
            {seller.store_phone && <p className="text-sm text-gray-600">{seller.store_phone}</p>}
          </div>

          <div className="text-center text-sm font-bold tracking-widest text-gray-700 mb-3">{kind.title}</div>

          <Separator className="my-3" />

          <div className="space-y-1 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-gray-600">{kind.numberLabel}</span>
              <span className="font-mono font-semibold">{invoiceNumber(sale)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span>{formatInvoiceDate(sale.created_at)}</span>
            </div>
            {einvoiceRows(sale).map(r => (
              <div key={r.label}>
                <div className="flex justify-between">
                  <span className="text-gray-600">{r.label}</span>
                  <span className={r.label === 'E-Invoice:' ? 'font-semibold text-amber-600' : 'font-mono'}>{r.value}</span>
                </div>
                {r.note && <p className="text-xs text-amber-700">{r.note}</p>}
              </div>
            ))}
            {sale.customer_name && (
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span>{sale.customer_name}</span>
              </div>
            )}
          </div>

          <Separator className="my-3" />

          {/* Items */}
          <div className="space-y-2 mb-4">
            {items.length > 0 ? items.map((item, index) => (
              <div key={index} className="text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">{item.name}</span>
                  <span>{formatCurrency(item.unitPrice * item.quantity - item.discount)}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-xs ml-2">
                  <span>{item.quantity} × {formatCurrency(item.unitPrice)}</span>
                  {item.discount > 0 && <span className="text-green-600">-{formatCurrency(item.discount)}</span>}
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-400 text-center">No items</p>
            )}
          </div>

          <Separator className="my-3" />

          {/* Totals */}
          <div className="space-y-1 text-sm mb-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>{formatCurrency(parseFloat(sale.subtotal || 0))}</span>
            </div>
            {sale.discount_amount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>{discountLabel(sale.discount_type)}:</span>
                <span>-{formatCurrency(parseFloat(sale.discount_amount))}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(parseFloat(sale.total_amount))}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Payment:</span>
              <span className="capitalize">{sale.payment_method?.replace('_', ' ')}</span>
            </div>
          </div>

          {specialDiscountRows(sale).length > 0 && (
            <>
              <Separator className="my-3" />
              <div className="space-y-1 text-sm">
                {specialDiscountRows(sale).map(r => (
                  <div key={r.label} className="flex justify-between gap-2">
                    <span className="text-gray-600">{r.label}</span>
                    <span className="text-right">{r.value || '____________________'}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* VAT breakdown — VAT-registered sellers only */}
          {vat.length > 0 && (
            <>
              <Separator className="my-3" />
              <div className="space-y-1 text-xs text-gray-600">
                {vat.map(r => (
                  <div key={r.label} className={`flex justify-between ${r.strong ? 'font-medium text-gray-700' : ''}`}>
                    <span>{r.label}:</span>
                    <span>{formatCurrency(r.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {machine.length > 0 && (
            <div className="mt-3 text-[11px] text-gray-500 space-y-0.5">
              {machine.map(m => <p key={m as string}>{m}</p>)}
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 mt-4 pt-3 border-t space-y-1">
            {notes.map(n => <p key={n} className="font-semibold text-gray-700">{n}</p>)}
            <p>Thank you for your purchase!</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-4 print:hidden">
          <Button variant="outline" onClick={() => printInvoice(html())}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={() => downloadInvoice(html(), sale, seller)}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" onClick={() => emailInvoice(sale, seller)}>
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
          <Button onClick={onNewSale} className="bg-[#E8302A] hover:bg-[#B91C1C]">
            <ShoppingBag className="h-4 w-4 mr-2" />
            New Sale
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
