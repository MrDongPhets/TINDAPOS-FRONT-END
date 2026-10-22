// Sale detail → Void / Return (Invoicing plan P0-7).
// A void or return is its own numbered document (ADJ-…): the invoice itself is never changed.
// The server works out the amount given back (same rules as the sale) and puts the stock back.
// The parent remounts it (key) on every open, so it always starts empty.
import { useMemo, useState } from 'react'
import { useApiClient } from '@/hooks/useApiClient'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { CORRECTION_REASONS, remainingQuantities, type AdjustmentKind, type SaleAdjustment } from '@/lib/saleAdjustments'

interface SaleItemRow { id: string; quantity: number | string; unit_price: number | string; total_price: number | string; products?: { name?: string } | null }

export function SaleAdjustmentDialog({ open, onOpenChange, saleId, items, adjustments, onDone }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  saleId: string
  items: SaleItemRow[]
  adjustments: SaleAdjustment[]
  onDone: (adjustment: SaleAdjustment) => void
}) {
  const { post } = useApiClient()
  const canVoid = adjustments.length === 0
  const remaining = useMemo(() => remainingQuantities(items, adjustments), [items, adjustments])
  const [kind, setKind] = useState<AdjustmentKind>(canVoid ? 'void' : 'return')
  const [qty, setQty] = useState<Record<string, string>>({})
  const [code, setCode] = useState(canVoid ? '04' : '09')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const chosen = items
    .map(i => ({ sales_item_id: i.id, quantity: Number(qty[i.id] || 0) }))
    .filter(r => r.quantity > 0)
  const tooMany = chosen.find(r => r.quantity > remaining[r.sales_item_id])
  const ready = reason.trim().length >= 3 && (kind === 'void' || (chosen.length > 0 && !tooMany))

  const submit = async () => {
    if (!ready) return
    if (kind === 'void' && !confirm('Void the whole sale? Stock goes back and this cannot be undone.')) return
    setBusy(true); setError(null)
    const res = await post(`/client/sales/${saleId}/adjustments`, {
      kind, reason: reason.trim(), correction_code: code, ...(kind === 'return' ? { items: chosen } : {}),
    })
    setBusy(false)
    if (res?.success) { onDone(res.data.adjustment); onOpenChange(false) }
    else setError(res?.error || 'Could not save')
  }

  return (
    <Dialog open={open} onOpenChange={v => !busy && onOpenChange(v)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Void / Return</DialogTitle>
          <DialogDescription>
            Saved as a separate adjustment (ADJ-…). The original invoice stays as it is; stock goes back to inventory.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={kind === 'void' ? 'default' : 'outline'} disabled={!canVoid} onClick={() => { setKind('void'); setCode('04') }}>
              Void whole sale
            </Button>
            <Button type="button" variant={kind === 'return' ? 'default' : 'outline'} onClick={() => { setKind('return'); setCode('09') }}>
              Return items
            </Button>
          </div>
          {!canVoid && <p className="text-xs text-gray-500">Items were already returned — return the rest instead of voiding.</p>}

          {kind === 'return' && (
            <div className="space-y-2">
              <Label>Items being returned</Label>
              <div className="rounded-md border divide-y">
                {items.map(i => {
                  const left = remaining[i.id]
                  const over = Number(qty[i.id] || 0) > left
                  return (
                    <div key={i.id} className="flex items-center gap-3 p-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{i.products?.name || 'Item'}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(Number(i.unit_price))} · {left > 0 ? `${left} can be returned` : 'all returned'}</p>
                      </div>
                      <Input
                        type="number" inputMode="decimal" min={0} max={left} step="any" disabled={left <= 0}
                        aria-label={`Return quantity for ${i.products?.name || 'item'}`}
                        className={`w-20 text-right ${over ? 'border-red-500' : ''}`}
                        value={qty[i.id] ?? ''} placeholder="0"
                        onChange={e => setQty(q => ({ ...q, [i.id]: e.target.value }))}
                      />
                      {left > 0 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => setQty(q => ({ ...q, [i.id]: String(left) }))}>All</Button>
                      )}
                    </div>
                  )
                })}
              </div>
              {tooMany && <p className="text-xs text-red-600">That's more than what can still be returned.</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={code} onValueChange={setCode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CORRECTION_REASONS.map(r => <SelectItem key={r.code} value={r.code}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="adj-reason">Reason</Label>
            <Textarea id="adj-reason" rows={3} maxLength={500} placeholder="e.g. Customer returned expired item" value={reason} onChange={e => setReason(e.target.value)} />
          </div>
          <p className="text-xs text-gray-500">The amount given back is worked out the same way as the sale (discounts and senior/PWD included) and shown after saving.</p>

          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button variant="destructive" onClick={submit} disabled={busy || !ready}>
            {busy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : kind === 'void' ? 'Void sale' : 'Save return'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
