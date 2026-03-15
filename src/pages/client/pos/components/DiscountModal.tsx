import { formatCurrency } from '@/lib/utils'
'use client'

import { useState, useEffect } from 'react'
import { Percent, DollarSign } from 'lucide-react'
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

const DISCOUNT_TYPES = [
  { id: 'percentage', label: 'Percentage', icon: Percent, symbol: '%' },
  { id: 'fixed', label: 'Fixed Amount', icon: DollarSign, symbol: '$' },
]

export default function DiscountModal({ open, onClose, onApply, currentDiscount, subtotal }) {
  const [discountType, setDiscountType] = useState(currentDiscount.type || 'percentage')
  const [discountValue, setDiscountValue] = useState(currentDiscount.value || '')

  useEffect(() => {
    if (open) {
      setDiscountType(currentDiscount.type || 'percentage')
      setDiscountValue(currentDiscount.value || '')
    }
  }, [open, currentDiscount])

  const calculateDiscountAmount = () => {
    const value = parseFloat(discountValue) || 0
    if (discountType === 'percentage') {
      return (subtotal * value) / 100
    }
    return value
  }

  const discountAmount = calculateDiscountAmount()
  const finalTotal = subtotal - discountAmount

  const handleApply = () => {
    const value = parseFloat(discountValue) || 0
    if (value <= 0) {
      alert('Please enter a valid discount value')
      return
    }

    if (discountType === 'percentage' && value > 100) {
      alert('Percentage cannot exceed 100%')
      return
    }

    if (discountType === 'fixed' && value > subtotal) {
      alert('Discount cannot exceed subtotal')
      return
    }

    onApply(discountType, value)
  }

  const handleRemove = () => {
    onApply(null, 0)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Apply Discount</DialogTitle>
          <DialogDescription>
            Subtotal: <span className="font-bold text-gray-900">{formatCurrency(subtotal)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Discount Type Selection */}
          <div>
            <Label className="mb-3 block">Discount Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {DISCOUNT_TYPES.map((type) => {
                const Icon = type.icon
                return (
                  <Card
                    key={type.id}
                    className={`
                      cursor-pointer transition-all p-4 border-2
                      ${discountType === type.id 
                        ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                      }
                    `}
                    onClick={() => setDiscountType(type.id)}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Icon className="h-6 w-6" />
                      <span className="font-medium text-sm">{type.label}</span>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Discount Value Input */}
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
                {DISCOUNT_TYPES.find(t => t.id === discountType)?.symbol}
              </div>
            </div>
          </div>

          {/* Discount Preview */}
          {discountValue && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span className="font-medium">{"-" + formatCurrency(discountAmount)}</span>
              </div>
              <div className="h-px bg-blue-300" />
              <div className="flex justify-between text-lg font-bold">
                <span>New Total</span>
                <span className="text-blue-600">{formatCurrency(finalTotal)}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {currentDiscount.type && (
              <Button
                variant="outline"
                onClick={handleRemove}
                className="text-red-600 hover:bg-red-50"
              >
                Remove Discount
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 bg-[#E8302A] hover:bg-[#B91C1C]"
              disabled={!discountValue || parseFloat(discountValue) <= 0}
            >
              Apply Discount
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}