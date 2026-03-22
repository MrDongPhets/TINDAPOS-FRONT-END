import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PackagePlus, TrendingUp, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useApiClient } from '@/hooks/useApiClient'

interface Product {
  id: string
  name: string
  sku: string
  stock_quantity: number
  cost_price?: number
  default_price?: number
  image_url?: string
  categories?: { name: string }
}

interface Props {
  open: boolean
  onClose: () => void
  product: Product | null
  onRestocked: () => void
}

export default function RestockSheet({ open, onClose, product, onRestocked }: Props) {
  const [qty, setQty] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const { post } = useApiClient()

  useEffect(() => {
    if (open && product) {
      setQty('')
      setCostPrice(product.cost_price != null ? String(product.cost_price) : '')
      setNote('')
    }
  }, [open, product])

  const parsedQty = parseInt(qty) || 0
  const parsedCost = parseFloat(costPrice)
  const isValid = parsedQty > 0 && !isNaN(parsedCost) && parsedCost >= 0

  const newTotal = product ? (product.stock_quantity || 0) + parsedQty : 0

  const handleSave = async () => {
    if (!product || !isValid) return

    setSaving(true)
    const result = await post(`/client/products/${product.id}/restock`, {
      qty: parsedQty,
      cost_price: parsedCost,
      note: note.trim() || undefined
    })
    setSaving(false)

    if (result.success) {
      toast({
        title: '✅ Restocked',
        description: `+${parsedQty} units added to ${product.name} at ₱${parsedCost.toFixed(2)}/unit`
      })
      onRestocked()
      onClose()
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to restock', variant: 'destructive' })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-blue-600" />
            Restock Product
          </SheetTitle>
          {product && (
            <p className="text-sm text-gray-500 mt-1">{product.name} · Current stock: <span className="font-semibold text-gray-700">{product.stock_quantity}</span></p>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Qty to add */}
          <div className="space-y-1.5">
            <Label htmlFor="restock-qty">Quantity to Add <span className="text-red-500">*</span></Label>
            <Input
              id="restock-qty"
              type="number"
              min="1"
              placeholder="e.g. 50"
              value={qty}
              onChange={e => setQty(e.target.value)}
              className="text-lg font-semibold"
            />
            {parsedQty > 0 && product && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                New total will be <span className="font-semibold text-green-700 ml-1">{newTotal}</span>
              </p>
            )}
          </div>

          {/* Cost price */}
          <div className="space-y-1.5">
            <Label htmlFor="restock-cost">Cost Price (₱) <span className="text-red-500">*</span></Label>
            <Input
              id="restock-cost"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 12.50"
              value={costPrice}
              onChange={e => setCostPrice(e.target.value)}
            />
            <p className="text-xs text-gray-400">What you paid the supplier</p>
          </div>
          {/* Warning: cost >= selling price */}
          {!isNaN(parsedCost) && product && (() => {
            const sell = product.default_price || 0
            if (parsedCost >= sell && sell > 0) return (
              <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>Cost (₱{parsedCost.toFixed(2)}) ≥ selling price (₱{sell.toFixed(2)}). You may be selling at a loss — consider updating the selling price via Edit Product.</span>
              </div>
            )
            if (sell > 0 && parsedCost > sell * 0.9) return (
              <div className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>Margin is less than 10% — consider updating the selling price via Edit Product.</span>
              </div>
            )
            return null
          })()}

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="restock-note">Note (optional)</Label>
            <Textarea
              id="restock-note"
              placeholder="e.g. Supplier delivery, PO #123..."
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
            />
          </div>

          {/* Summary box */}
          {isValid && product && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-1 text-sm">
              <p className="font-semibold text-blue-800 mb-2">Restock Summary</p>
              <div className="flex justify-between text-blue-700">
                <span>Units added</span>
                <span className="font-semibold">+{parsedQty}</span>
              </div>
              <div className="flex justify-between text-blue-700">
                <span>Cost per unit</span>
                <span className="font-semibold">₱{parsedCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-blue-700">
                <span>Total cost value</span>
                <span className="font-semibold">₱{(parsedQty * parsedCost).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-blue-800 font-semibold border-t border-blue-200 pt-1 mt-1">
                <span>New stock total</span>
                <span>{newTotal}</span>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t flex gap-2 justify-end bg-white">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={saving || !isValid}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <PackagePlus className="h-4 w-4 mr-1.5" />
            {saving ? 'Saving...' : 'Confirm Restock'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
