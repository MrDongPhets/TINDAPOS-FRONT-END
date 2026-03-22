'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Package, TrendingUp, TrendingDown } from "lucide-react"
import { toast } from "sonner"
import API_CONFIG from '@/config/api';

export default function StockAdjustmentModal({ product, open, onOpenChange, onStockUpdated }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    adjustment_type: '',
    quantity: '',
    reason: '',
    notes: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.adjustment_type || !formData.quantity) {
      toast.error('Adjustment type and quantity are required')
      return
    }


    if (parseInt(formData.quantity) <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('authToken')
      const payload: Record<string, unknown> = {
        product_id: product.id,
        adjustment_type: formData.adjustment_type,
        quantity: parseInt(formData.quantity),
        reason: formData.reason || undefined,
        notes: formData.notes || undefined,
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/client/inventory/adjust-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Stock adjustment completed successfully!')
        onStockUpdated()
        onOpenChange(false)
        setFormData({
          adjustment_type: '',
          quantity: '',
          reason: '',
          notes: ''
        })
      } else {
        toast.error(data.error || 'Failed to adjust stock')
      }
    } catch (error) {
      console.error('Error adjusting stock:', error)
      toast.error('Failed to adjust stock')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (!product) return null

  const currentStock = product.stock_quantity || 0
  const adjustmentQty = parseInt(formData.quantity) || 0
  const newStock = formData.adjustment_type === 'increase' 
    ? currentStock + adjustmentQty 
    : Math.max(0, currentStock - adjustmentQty)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock - {product.name}</DialogTitle>
        </DialogHeader>
        
        {/* Current Stock Info */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Package className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">{product.name}</p>
            <p className="text-sm text-gray-500">
              Current Stock: <span className="font-semibold">{currentStock} units</span>
            </p>
            {product.sku && (
              <p className="text-xs text-gray-400">SKU: {product.sku}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Adjustment Type */}
          <div className="space-y-2">
            <Label htmlFor="adjustment_type">Adjustment Type *</Label>
            <Select 
              value={formData.adjustment_type} 
              onValueChange={(value) => handleChange('adjustment_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select adjustment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="increase">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Increase Stock
                  </div>
                </SelectItem>
                <SelectItem value="decrease">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    Decrease Stock
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', e.target.value)}
              placeholder="Enter quantity"
              disabled={loading}
              required
            />
          </div>


          {/* Preview */}
          {formData.adjustment_type && formData.quantity && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Current Stock:</span>
                <span className="font-medium">{currentStock}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Adjustment:</span>
                <span className={`font-medium ${
                  formData.adjustment_type === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formData.adjustment_type === 'increase' ? '+' : '-'}{adjustmentQty}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-semibold pt-2 border-t border-blue-300">
                <span className="text-gray-900">New Stock:</span>
                <span className="text-blue-600">{newStock}</span>
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Select 
              value={formData.reason} 
              onValueChange={(value) => handleChange('reason', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reason (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="damaged">Damaged goods</SelectItem>
                <SelectItem value="expired">Expired products</SelectItem>
                <SelectItem value="theft">Theft/Loss</SelectItem>
                <SelectItem value="recount">Stock recount</SelectItem>
                <SelectItem value="supplier_return">Supplier return</SelectItem>
                <SelectItem value="found">Found stock</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes about this adjustment"
              disabled={loading}
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.adjustment_type || !formData.quantity}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adjust Stock
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}