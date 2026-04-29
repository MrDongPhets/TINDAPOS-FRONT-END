import { formatCurrency } from '@/lib/utils'
'use client'

import { Printer, Download, Mail, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

export default function ReceiptModal({ open, onClose, sale, store, onNewSale, cartItems = [] }) {
  if (!sale) return null

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const vatableAmount = parseFloat(sale.vatable_amount || 0)
  const vatExemptAmount = parseFloat(sale.vat_exempt_amount || 0)
  const zeroRatedAmount = parseFloat(sale.zero_rated_amount || 0)
  const vatAmount = parseFloat(sale.tax_amount || 0)
  const hasVat = vatAmount > 0 || vatableAmount > 0 || vatExemptAmount > 0 || zeroRatedAmount > 0
  const orNumber = sale.or_number || sale.receipt_number
  const companyData = (() => { try { return JSON.parse(localStorage.getItem('companyData') || '{}') } catch { return {} } })()
  const tin = companyData.tax_id || ''

  const handlePrint = () => {
    const storeName = store?.name || 'Store'
    const storeAddress = store?.address || ''
    const storePhone = store?.phone || ''

    const itemsHtml = cartItems.map(item => `
      <tr>
        <td style="padding:4px 0">${item.name}</td>
        <td style="text-align:center;padding:4px 8px">${item.quantity}</td>
        <td style="text-align:right;padding:4px 0">₱${(item.price * item.quantity - (item.discount_amount || 0)).toFixed(2)}</td>
      </tr>
    `).join('')

    const vatHtml = hasVat ? `
      <div class="divider"></div>
      ${vatableAmount > 0 ? `<div class="row"><span>VATable Sales:</span><span>₱${(vatableAmount / 1.12).toFixed(2)}</span></div>` : ''}
      ${vatExemptAmount > 0 ? `<div class="row"><span>VAT-Exempt:</span><span>₱${vatExemptAmount.toFixed(2)}</span></div>` : ''}
      ${zeroRatedAmount > 0 ? `<div class="row"><span>Zero-Rated:</span><span>₱${zeroRatedAmount.toFixed(2)}</span></div>` : ''}
      ${vatAmount > 0 ? `<div class="row"><span>VAT 12%:</span><span>₱${vatAmount.toFixed(2)}</span></div>` : ''}
    ` : ''

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Official Receipt</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 300px; margin: 0 auto; padding: 16px; }
          .center { text-align: center; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .bold { font-weight: bold; }
          .large { font-size: 14px; }
          .row { display: flex; justify-content: space-between; padding: 2px 0; }
          table { width: 100%; border-collapse: collapse; }
          .total-row td { font-weight: bold; font-size: 14px; border-top: 1px dashed #000; padding-top: 6px; }
          .footer { margin-top: 12px; text-align: center; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="bold large">${storeName}</div>
          ${storeAddress ? `<div>${storeAddress}</div>` : ''}
          ${storePhone ? `<div>${storePhone}</div>` : ''}
          ${tin ? `<div>TIN: ${tin}</div>` : ''}
        </div>
        <div class="divider"></div>
        <div class="bold center">OFFICIAL RECEIPT</div>
        <div class="divider"></div>
        <div class="row"><span>OR #:</span><span>${orNumber}</span></div>
        <div class="row"><span>Date:</span><span>${formatDate(sale.created_at)}</span></div>
        ${sale.customer_name ? `<div class="row"><span>Customer:</span><span>${sale.customer_name}</span></div>` : ''}
        <div class="divider"></div>
        <table>
          <thead>
            <tr>
              <th style="text-align:left">Item</th>
              <th style="text-align:center">Qty</th>
              <th style="text-align:right">Amount</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="2">TOTAL</td>
              <td style="text-align:right">₱${parseFloat(sale.total_amount).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        <div style="margin-top:6px">Payment: ${(sale.payment_method || 'cash').replace('_', ' ').toUpperCase()}</div>
        ${vatHtml}
        <div class="divider"></div>
        <div class="footer">
          <div>Thank you for your purchase!</div>
          <div>Please keep this receipt for your records.</div>
          ${tin ? `<div style="margin-top:4px">This serves as your Official Receipt</div>` : ''}
        </div>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank', 'width=400,height=600')
    if (printWindow) {
      printWindow.document.write(printHtml)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }
  }

  const handleDownload = () => {
    alert('PDF download will be implemented')
  }

  const handleEmail = () => {
    alert('Email receipt will be implemented')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            Sale Completed! 🎉
          </DialogTitle>
        </DialogHeader>

        {/* Receipt Preview */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 print:border-0">
          {/* Store Header */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold">{store?.name || 'Store'}</h2>
            {store?.address && <p className="text-sm text-gray-600 mt-1">{store.address}</p>}
            {store?.phone && <p className="text-sm text-gray-600">{store.phone}</p>}
            {tin && <p className="text-sm text-gray-600">TIN: {tin}</p>}
          </div>

          <div className="text-center text-xs font-semibold tracking-widest text-gray-500 mb-3">OFFICIAL RECEIPT</div>

          <Separator className="my-3" />

          {/* Receipt Info */}
          <div className="space-y-1 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-gray-600">OR #:</span>
              <span className="font-mono font-semibold">{orNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span>{formatDate(sale.created_at)}</span>
            </div>
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
            {cartItems.length > 0 ? cartItems.map((item, index) => (
              <div key={index} className="text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">{item.name}</span>
                  <span>{formatCurrency(item.price * item.quantity - (item.discount_amount || 0))}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-xs ml-2">
                  <span>{item.quantity} × {formatCurrency(item.price)}</span>
                  {item.discount_amount > 0 && (
                    <span className="text-green-600">-{formatCurrency(item.discount_amount)}</span>
                  )}
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
                <span>Discount:</span>
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

          {/* VAT Breakdown */}
          {hasVat && (
            <>
              <Separator className="my-3" />
              <div className="space-y-1 text-xs text-gray-600">
                {vatableAmount > 0 && (
                  <div className="flex justify-between">
                    <span>VATable Sales (ex-VAT):</span>
                    <span>{formatCurrency(vatableAmount / 1.12)}</span>
                  </div>
                )}
                {vatExemptAmount > 0 && (
                  <div className="flex justify-between">
                    <span>VAT-Exempt:</span>
                    <span>{formatCurrency(vatExemptAmount)}</span>
                  </div>
                )}
                {zeroRatedAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Zero-Rated:</span>
                    <span>{formatCurrency(zeroRatedAmount)}</span>
                  </div>
                )}
                {vatAmount > 0 && (
                  <div className="flex justify-between font-medium text-gray-700">
                    <span>VAT 12%:</span>
                    <span>{formatCurrency(vatAmount)}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 mt-4 pt-3 border-t">
            <p>Thank you for your purchase!</p>
            {tin && <p className="mt-1">This serves as your Official Receipt</p>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-4 print:hidden">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" onClick={handleEmail}>
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
