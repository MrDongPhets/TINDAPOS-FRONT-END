import { formatCurrency } from '@/lib/utils'
'use client'

import { useState, useEffect } from 'react'
import { Percent, DollarSign, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'

// scPwdDiscount: the senior citizen / PWD discount for the current cart, computed item by item by the POS (lib/vat).
// requireBeneficiary: e-invoice stores must record the beneficiary (TaxTrail won't issue without it).
const BENEFICIARY_ID = /^[A-Za-z0-9-/ ]{3,50}$/

export default function DiscountModal({ open, onClose, onApply, currentDiscount, subtotal, vatStatus = 'vat', scPwdDiscount = 0, requireBeneficiary = false }) {
  const isVatSeller = vatStatus !== 'non_vat'
  const [beneficiaryName, setBeneficiaryName] = useState('')
  const [beneficiaryId, setBeneficiaryId] = useState('')
  const [beneficiaryError, setBeneficiaryError] = useState('')
  const [discountType, setDiscountType] = useState('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [seniorType, setSeniorType] = useState<'senior_citizen' | 'pwd'>('senior_citizen')

  useEffect(() => {
    if (open) {
      const t = currentDiscount.type
      setBeneficiaryName(currentDiscount.beneficiary?.name || '')
      setBeneficiaryId(currentDiscount.beneficiary?.idNumber || '')
      setBeneficiaryError('')
      if (t === 'senior_citizen' || t === 'pwd') {
        setDiscountType('senior_pwd')
        setSeniorType(t)
      } else {
        setDiscountType(t || 'percentage')
        setDiscountValue(currentDiscount.value ? String(currentDiscount.value) : '')
      }
    }
  }, [open, currentDiscount])

  const discountAmount = (() => {
    if (discountType === 'senior_pwd') return scPwdDiscount
    const v = parseFloat(discountValue) || 0
    if (discountType === 'percentage') return (subtotal * v) / 100
    return v
  })()

  const finalTotal = subtotal - discountAmount

  const handleApply = () => {
    if (discountType === 'senior_pwd') {
      const name = beneficiaryName.trim()
      const id = beneficiaryId.trim()
      if (requireBeneficiary && (!name || !id)) { setBeneficiaryError('Enter the name and ID number from the card (needed for the e-invoice)'); return }
      if ((name || id) && name.length < 2) { setBeneficiaryError('Enter the name as printed on the ID'); return }
      if ((name || id) && !BENEFICIARY_ID.test(id)) { setBeneficiaryError('Enter the ID number as printed on the card'); return }
      onApply(seniorType, 20, name && id ? { name, idNumber: id } : null)
      return
    }
    const value = parseFloat(discountValue) || 0
    if (value <= 0) { alert('Please enter a valid discount value'); return }
    if (discountType === 'percentage' && value > 100) { alert('Percentage cannot exceed 100%'); return }
    if (discountType === 'fixed' && value > subtotal) { alert('Discount cannot exceed subtotal'); return }
    onApply(discountType, value)
  }

  const handleRemove = () => onApply(null, 0)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Apply Discount</DialogTitle>
          <DialogDescription>
            Subtotal: <span className="font-bold text-gray-900">{formatCurrency(subtotal)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Discount Type Cards */}
          <div>
            <Label className="mb-3 block">Discount Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'percentage', label: 'Percentage', Icon: Percent },
                { id: 'fixed',      label: 'Fixed Amount', Icon: DollarSign },
                { id: 'senior_pwd', label: 'Senior / PWD', Icon: Heart },
              ].map(({ id, label, Icon }) => (
                <Card
                  key={id}
                  className={`cursor-pointer transition-all p-3 border-2 ${
                    discountType === id
                      ? 'ring-2 ring-[#E8302A] border-[#E8302A] bg-red-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setDiscountType(id)}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <Icon className={`h-5 w-5 ${discountType === id ? 'text-[#E8302A]' : 'text-gray-500'}`} />
                    <span className="font-medium text-xs text-center leading-tight">{label}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* SC/PWD sub-type + info */}
          {discountType === 'senior_pwd' && (
            <div className="space-y-3">
              <div>
                <Label className="mb-2 block">Discount For</Label>
                <div className="grid grid-cols-2 gap-2">
                  {([['senior_citizen', 'Senior Citizen'], ['pwd', 'PWD']] as const).map(([type, label]) => (
                    <button
                      key={type}
                      onClick={() => setSeniorType(type)}
                      className={`py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        seniorType === type
                          ? 'border-[#E8302A] bg-red-50 text-[#E8302A]'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-1">
                <p className="font-semibold">RA 9994 (Senior) / RA 7277 (PWD)</p>
                {isVatSeller ? (
                  <>
                    <p>• VAT is removed from VATable items first (÷ 1.12)</p>
                    <p>• 20% off each item (VAT-exempt items: 20% off the price)</p>
                    <p>• The whole sale is VAT-exempt</p>
                  </>
                ) : (
                  <p>• 20% discount on the price (your store is Non-VAT, so there's no VAT to remove)</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sc-name">Name (as on the ID){requireBeneficiary ? ' *' : ''}</Label>
                <Input id="sc-name" value={beneficiaryName} onChange={e => { setBeneficiaryName(e.target.value); setBeneficiaryError('') }} placeholder="Juan Dela Cruz" maxLength={200} autoComplete="off" />
                <Label htmlFor="sc-id">{seniorType === 'senior_citizen' ? 'OSCA / Senior Citizen ID No.' : 'PWD ID No.'}{requireBeneficiary ? ' *' : ''}</Label>
                <Input id="sc-id" value={beneficiaryId} onChange={e => { setBeneficiaryId(e.target.value); setBeneficiaryError('') }} placeholder="e.g. 12345-678" maxLength={50} autoComplete="off" />
                {!requireBeneficiary && <p className="text-xs text-gray-500">Optional — printed on the invoice for your SC/PWD records.</p>}
                {beneficiaryError && <p className="text-xs text-red-600">{beneficiaryError}</p>}
              </div>
            </div>
          )}

          {/* Value input for percentage / fixed */}
          {discountType !== 'senior_pwd' && (
            <div>
              <Label htmlFor="discountValue">
                Discount {discountType === 'percentage' ? 'Percentage' : 'Amount'}
              </Label>
              <div className="relative mt-2">
                <Input
                  id="discountValue"
                  type="number"
                  step="0.01"
                  placeholder={discountType === 'percentage' ? '0' : '0.00'}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="text-lg font-bold pr-10"
                  autoFocus
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                  {discountType === 'percentage' ? '%' : '₱'}
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          {(discountType === 'senior_pwd' || (discountValue && parseFloat(discountValue) > 0)) && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-700">
                <span>
                  {discountType === 'senior_pwd'
                    ? `${seniorType === 'senior_citizen' ? 'Senior Citizen' : 'PWD'} Discount (20%)`
                    : `Discount${discountType === 'percentage' ? ` (${discountValue}%)` : ''}`}
                </span>
                <span className="font-medium">-{formatCurrency(discountAmount)}</span>
              </div>
              <div className="h-px bg-green-300" />
              <div className="flex justify-between text-lg font-bold">
                <span>New Total</span>
                <span className="text-green-700">{formatCurrency(finalTotal)}</span>
              </div>
              {discountType === 'senior_pwd' && isVatSeller && (
                <p className="text-xs text-green-600 text-center">VAT-Exempt</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {currentDiscount.type && (
              <Button variant="outline" onClick={handleRemove} className="text-red-600 hover:bg-red-50">
                Remove
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              onClick={handleApply}
              className="flex-1 bg-[#E8302A] hover:bg-[#B91C1C]"
              disabled={discountType !== 'senior_pwd' && (!discountValue || parseFloat(discountValue) <= 0)}
            >
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
