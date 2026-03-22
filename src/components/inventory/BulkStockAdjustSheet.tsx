import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Package, Save, RotateCcw, Plus, Minus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useApiClient } from '@/hooks/useApiClient'

interface Product {
  id: string
  name: string
  sku: string
  stock_quantity: number
  max_stock_level: number
  cost_price?: number
  image_url?: string
  categories?: { name: string }
  is_composite?: boolean
}

interface AdjustRow {
  product_id: string
  name: string
  sku: string
  image_url?: string
  category: string
  current_stock: number
  current_cost: number
  max_stock: number
  new_stock: string
}

interface Props {
  open: boolean
  onClose: () => void
  products: Product[]
  onSaved: () => void
}

export default function BulkStockAdjustSheet({ open, onClose, products, onSaved }: Props) {
  const [rows, setRows] = useState<AdjustRow[]>([])
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  const { toast } = useToast()
  const { post } = useApiClient()

  useEffect(() => {
    if (open) {
      const validProducts = products.filter(p =>
        !p.is_composite && p.stock_quantity !== null && p.stock_quantity !== undefined
      )
      setRows(
        validProducts.map(p => ({
          product_id: p.id,
          name: p.name,
          sku: p.sku,
          image_url: p.image_url,
          category: p.categories?.name || '',
          current_stock: p.stock_quantity,
          current_cost: p.cost_price || 0,
          max_stock: p.max_stock_level || 0,
          new_stock: String(p.stock_quantity)
        }))
      )
      setSearch('')
      setShowAll(false)
    }
  }, [open, products])

  const updateStock = (product_id: string, value: string) => {
    setRows(prev => prev.map(r => r.product_id === product_id ? { ...r, new_stock: value } : r))
  }

  const resetRow = (product_id: string) => {
    setRows(prev => prev.map(r =>
      r.product_id === product_id ? { ...r, new_stock: String(r.current_stock) } : r
    ))
  }

  const changedRows = rows.filter(r => {
    const parsed = parseInt(r.new_stock)
    return !isNaN(parsed) && parsed !== r.current_stock
  })

  const handleSave = async () => {
    if (changedRows.length === 0) {
      toast({ title: 'No changes', description: 'No stock values were changed.' })
      return
    }

    setSaving(true)
    const result = await post('/client/products/bulk-adjust', {
      adjustments: changedRows.map(r => ({
        product_id: r.product_id,
        new_stock: parseInt(r.new_stock)
      }))
    })

    setSaving(false)

    if (result.success) {
      toast({ title: '✅ Stock updated', description: `${result.data.updated} product(s) updated successfully.` })
      onSaved()
      onClose()
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to save', variant: 'destructive' })
    }
  }

  const isLowStock = (row: AdjustRow) => {
    const threshold = row.max_stock ? Math.ceil(row.max_stock * 0.3) : 5
    return row.current_stock <= threshold
  }

  const filtered = rows.filter(r => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.sku.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase())
    if (!matchesSearch) return false
    return showAll ? true : isLowStock(r)
  })

  const lowStockCount = rows.filter(isLowStock).length

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-[#E8302A]" />
            Bulk Stock Adjustment
          </SheetTitle>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-500 flex-1">
              {showAll ? 'All products' : `Low stock only (${lowStockCount})`}
            </p>
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setShowAll(v => !v)}>
              {showAll ? 'Low Stock Only' : 'Show All'}
            </Button>
          </div>
        </SheetHeader>

        {/* Search */}
        <div className="px-6 py-3 border-b">
          <Input
            placeholder="Search by name, SKU, category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Product rows */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-medium">
                {showAll ? 'No products found' : 'No low stock products'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {showAll ? 'Try a different search.' : 'All products have sufficient stock.'}
              </p>
              {!showAll && (
                <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={() => setShowAll(true)}>
                  Show All Products
                </Button>
              )}
            </div>
          )}
          {filtered.map(row => {
            const parsed = parseInt(row.new_stock)
            const isChanged = !isNaN(parsed) && parsed !== row.current_stock

            return (
              <div key={row.product_id} className={`flex flex-col gap-2 p-3 rounded-xl border transition-colors ${isChanged ? 'border-orange-300 bg-orange-50' : 'border-gray-100 bg-white'}`}>
                <div className="flex items-center gap-3">
                  {/* Image */}
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {row.image_url
                      ? <img src={row.image_url} alt={row.name} className="w-full h-full object-cover" />
                      : <Package className="h-4 w-4 text-gray-400" />
                    }
                  </div>

                  {/* Name + category */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{row.name}</p>
                    <p className="text-xs text-gray-400">
                      {row.category || 'No category'} · Stock: <span className={isLowStock(row) ? 'text-orange-600 font-medium' : ''}>{row.current_stock}</span>
                    </p>
                  </div>

                  {/* +/- controls */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline" size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => updateStock(row.product_id, String(Math.max(0, (parseInt(row.new_stock) || 0) - 1)))}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      min="0"
                      value={row.new_stock}
                      onChange={e => updateStock(row.product_id, e.target.value)}
                      className={`h-8 w-16 text-center ${isChanged ? 'border-orange-400 font-semibold' : ''}`}
                    />
                    <Button
                      variant="outline" size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => updateStock(row.product_id, String((parseInt(row.new_stock) || 0) + 1))}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Reset */}
                  {isChanged && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400" onClick={() => resetRow(row.product_id)}>
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between gap-3 bg-white">
          <p className="text-sm text-gray-500">
            {changedRows.length === 0 ? 'No changes yet' : `${changedRows.length} product(s) will be updated`}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || changedRows.length === 0}
              className="bg-[#E8302A] hover:bg-[#c0241f] text-white"
            >
              <Save className="h-4 w-4 mr-1.5" />
              {saving ? 'Saving...' : `Save${changedRows.length > 0 ? ` (${changedRows.length})` : ''}`}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
