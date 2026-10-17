import { useEffect, useMemo, useState } from 'react'
import { useApiClient } from '@/hooks/useApiClient'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency } from '@/lib/utils'
import API_CONFIG from '@/config/api'
import {
  computeGcashFee, describeFeeRule, DEFAULT_FEE_RULE, GCASH_TYPE_LABELS,
  type GcashSettings, type GcashType,
} from '@/lib/finance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowDownToLine, ArrowUpFromLine, Loader2, Smartphone } from 'lucide-react'

const { GCASH, GCASH_SETTINGS } = API_CONFIG.ENDPOINTS.FINANCE

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
  storeId?: string | null // owner's selected store; staff are always their own store
}

// Record a GCash cash-in / cash-out with the fee calculated from the store's fee rules
export function GcashDialog({ open, onOpenChange, onSaved, storeId }: Props) {
  const { get, post } = useApiClient()
  const { toast } = useToast()

  const [settings, setSettings] = useState<GcashSettings>({ cash_in: DEFAULT_FEE_RULE, cash_out: DEFAULT_FEE_RULE })
  const [type, setType] = useState<GcashType>('cash_in')
  const [amount, setAmount] = useState('')
  const [feeOverride, setFeeOverride] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [reference, setReference] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    get(GCASH_SETTINGS).then(res => {
      if (res?.success && res.data?.settings) setSettings(res.data.settings)
    })
  }, [open, get])

  const reset = () => {
    setAmount(''); setFeeOverride(''); setCustomerName(''); setReference(''); setError('')
  }

  const amountNum = Number(amount) || 0
  const autoFee = useMemo(() => computeGcashFee(amountNum, settings[type]), [amountNum, settings, type])
  const fee = feeOverride !== '' ? Number(feeOverride) || 0 : autoFee

  const handleSave = async () => {
    setError('')
    if (!(amountNum > 0)) { setError('Enter a valid amount'); return }
    if (fee < 0) { setError('Fee cannot be negative'); return }

    setSaving(true)
    const res = await post(GCASH, {
      type,
      amount: amountNum,
      fee,
      customer_name: customerName.trim() || null,
      reference_number: reference.trim() || null,
      store_id: storeId || null,
    })
    setSaving(false)

    if (res?.success) {
      toast({ title: `${GCASH_TYPE_LABELS[type].label} recorded`, description: `Fee earned: ${formatCurrency(fee)}` })
      reset()
      onOpenChange(false)
      onSaved?.()
    } else {
      setError(res?.error || 'Failed to record transaction')
    }
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) reset(); onOpenChange(o) }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-blue-600" /> GCash Transaction
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type */}
          <div className="grid grid-cols-2 gap-2">
            {(['cash_in', 'cash_out'] as GcashType[]).map(t => {
              const Icon = t === 'cash_in' ? ArrowDownToLine : ArrowUpFromLine
              const active = type === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setType(t); setFeeOverride('') }}
                  className={`rounded-xl border-2 p-3 text-left transition-colors ${active ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <Icon className={`h-4 w-4 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
                    {GCASH_TYPE_LABELS[t].label}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-snug">{GCASH_TYPE_LABELS[t].hint}</p>
                </button>
              )
            })}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="gcash-amount">Amount</Label>
            <Input
              id="gcash-amount"
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="text-lg"
              autoFocus
            />
          </div>

          {/* Fee */}
          <div className="space-y-1.5">
            <Label htmlFor="gcash-fee">
              Fee <span className="text-xs font-normal text-gray-500">— auto: {describeFeeRule(settings[type])}</span>
            </Label>
            <Input
              id="gcash-fee"
              type="number"
              inputMode="decimal"
              min={0}
              placeholder={autoFee.toFixed(2)}
              value={feeOverride}
              onChange={e => setFeeOverride(e.target.value)}
            />
            <p className="text-xs text-gray-500">Leave blank to use the automatic fee.</p>
          </div>

          {/* What to collect / give */}
          {amountNum > 0 && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 space-y-1 text-sm">
              {type === 'cash_in' ? (
                <div className="flex justify-between font-semibold text-blue-900">
                  <span>Collect cash from customer</span>
                  <span>{formatCurrency(amountNum + fee)}</span>
                </div>
              ) : (
                <div className="flex justify-between font-semibold text-blue-900">
                  <span>Give cash to customer</span>
                  <span>{formatCurrency(Math.max(amountNum - fee, 0))}</span>
                </div>
              )}
              <div className="flex justify-between text-blue-800/80">
                <span>Your earnings (fee)</span>
                <span>{formatCurrency(fee)}</span>
              </div>
              {type === 'cash_out' && (
                <p className="text-xs text-blue-800/70">If the customer pays the fee separately, give the full {formatCurrency(amountNum)}.</p>
              )}
            </div>
          )}

          {/* Optional details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="gcash-customer">Customer (optional)</Label>
              <Input id="gcash-customer" value={customerName} onChange={e => setCustomerName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gcash-ref">Ref. no. (optional)</Label>
              <Input id="gcash-ref" value={reference} onChange={e => setReference(e.target.value)} />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !(amountNum > 0)} className="bg-blue-600 hover:bg-blue-700">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Record {GCASH_TYPE_LABELS[type].label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
