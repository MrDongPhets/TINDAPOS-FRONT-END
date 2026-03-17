import { formatCurrency } from '@/lib/utils'
'use client'

import { ShoppingCart, Trash2, Plus, Minus, Percent, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import CartItem from './CartItem'

export default function Cart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  subtotal,
  discount,
  total,
  itemsCount,
  onApplyDiscount,
  onCheckout,
  hasDiscount,
  onClearCart
}) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Cart ({itemsCount})
          </CardTitle>
          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearCart}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <CardContent className="p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">Your cart is empty</p>
              <p className="text-sm text-gray-400 mt-1">Add products to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <CartItem
                  key={item.product_id}
                  item={item}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemove={onRemoveItem}
                />
              ))}
            </div>
          )}
        </CardContent>
      </div>

      {/* Summary */}
      {items.length > 0 && (
        <div className="border-t bg-gray-50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] space-y-3">
          {/* Subtotal */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>

          {/* Discount */}
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>{"-" + formatCurrency(discount)}</span>
            </div>
          )}

          <Separator />

          {/* Total */}
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-blue-600">{formatCurrency(total)}</span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <Button
              onClick={onApplyDiscount}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Percent className="h-4 w-4 mr-2" />
              {hasDiscount ? 'Change Discount' : 'Apply Discount'}
            </Button>

            <Button
              onClick={onCheckout}
              className="w-full bg-[#E8302A] hover:bg-[#B91C1C]"
              size="lg"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Checkout ({formatCurrency(total)})
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}