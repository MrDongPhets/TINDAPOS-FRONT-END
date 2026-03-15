import { formatCurrency } from '@/lib/utils'
'use client'

import { Plus, Minus, X, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function CartItem({ item, onUpdateQuantity, onRemove }) {
  const handleQuantityChange = (newQuantity) => {
    const quantity = parseInt(newQuantity) || 0
    if (quantity >= 0 && quantity <= item.stock_quantity) {
      onUpdateQuantity(item.product_id, quantity)
    }
  }

  const itemTotal = item.price * item.quantity - (item.discount_amount || 0)

  return (
    <Card className="p-3 hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        {/* Product Image */}
        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="h-6 w-6 text-gray-400" />
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
              <p className="text-xs text-gray-500">{formatCurrency(item.price)} each</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(item.product_id)}
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(item.quantity - 1)}
                disabled={item.quantity <= 0}
                className="h-8 w-8 p-0"
              >
                <Minus className="h-3 w-3" />
              </Button>

              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="h-8 w-16 text-center"
                min="0"
                max={item.stock_quantity}
              />

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={item.quantity >= item.stock_quantity}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Item Total */}
            <div className="text-right">
              <p className="font-bold text-sm">{formatCurrency(itemTotal)}</p>
              {item.stock_quantity <= 5 && (
                <p className="text-xs text-orange-600">
                  Only {item.stock_quantity} left
                </p>
              )}
            </div>
          </div>

          {/* Discount indicator */}
          {item.discount_amount > 0 && (
            <div className="mt-1 text-xs text-green-600">
              Discount: {"-" + formatCurrency(item.discount_amount)}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}