import { useEffect, useState } from 'react'
import { useApiClient } from '@/hooks/useApiClient'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency } from '@/lib/utils'
import API_CONFIG from '@/config/api'
import { dayEndIso, dayStartIso, GCASH_TYPE_LABELS, rangeFor, type GcashType, type RangePreset } from '@/lib/finance'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ALL_STORES, FinanceFilters } from './FinanceFilters'
import { GcashDialog } from './GcashDialog'
import { ArrowDownToLine, ArrowUpFromLine, Coins, Loader2, Plus, Smartphone, Trash2 } from 'lucide-react'

const { GCASH } = API_CONFIG.ENDPOINTS.FINANCE

type Transaction = {
  id: string
  type: GcashType
  amount: number | string
  fee: number | string
  customer_name: string | null
  reference_number: string | null
  created_at: string
}

type Summary = { cash_in_count: number; cash_in_total: number; cash_out_count: number; cash_out_total: number; total_fees: number }

const EMPTY_SUMMARY: Summary = { cash_in_count: 0, cash_in_total: 0, cash_out_count: 0, cash_out_total: 0, total_fees: 0 }

// GCash cash-in / cash-out list + summary. Owner: store filter + delete. Staff: own store, add only.
export function GcashView({ isOwner }: { isOwner: boolean }) {
  const { get, delete: del } = useApiClient()
  const { toast } = useToast()

  const [range, setRange] = useState<RangePreset>('today')
  const [storeId, setStoreId] = useState(ALL_STORES)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [reloadKey, setReloadKey] = useState(0)

  // Refetch after a change (filters / save / delete) — loading is set here, not inside the effect
  const reload = () => { setLoading(true); setReloadKey(k => k + 1) }
  const changeRange = (r: RangePreset) => { setLoading(true); setRange(r) }
  const changeStore = (id: string) => { setLoading(true); setStoreId(id) }

  useEffect(() => {
    let cancelled = false
    const { start, end } = rangeFor(range)
    const params = new URLSearchParams()
    if (start) params.set('start_date', dayStartIso(start))
    if (end) params.set('end_date', dayEndIso(end))
    if (isOwner && storeId !== ALL_STORES) params.set('store_id', storeId)
    params.set('_', String(Date.now()))

    get(`${GCASH}?${params}`).then(res => {
      if (cancelled) return
      if (res?.success) {
        setTransactions(res.data?.transactions || [])
        setSummary(res.data?.summary || EMPTY_SUMMARY)
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [get, range, storeId, isOwner, reloadKey])

  const handleDelete = async (t: Transaction) => {
    if (!window.confirm(`Delete this ${GCASH_TYPE_LABELS[t.type].label} of ${formatCurrency(t.amount)}?`)) return
    const res = await del(`${GCASH}/${t.id}`)
    if (res?.success) {
      toast({ title: 'Transaction deleted' })
      reload()
    } else {
      toast({ title: 'Failed to delete', description: res?.error, variant: 'destructive' })
    }
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-3.5 shadow-sm text-white">
          <p className="text-xs font-medium text-white/80">Cash-In</p>
          <p className="text-xl font-bold mt-0.5">{formatCurrency(summary.cash_in_total)}</p>
          <p className="text-[11px] text-white/70">{summary.cash_in_count} transaction{summary.cash_in_count === 1 ? '' : 's'}</p>
        </div>
        <div className="bg-gradient-to-br from-sky-500 to-cyan-600 rounded-2xl p-3.5 shadow-sm text-white">
          <p className="text-xs font-medium text-white/80">Cash-Out</p>
          <p className="text-xl font-bold mt-0.5">{formatCurrency(summary.cash_out_total)}</p>
          <p className="text-[11px] text-white/70">{summary.cash_out_count} transaction{summary.cash_out_count === 1 ? '' : 's'}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-3.5 shadow-sm text-white flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-white/80">Fees Earned</p>
            <p className="text-xl font-bold mt-0.5">{formatCurrency(summary.total_fees)}</p>
            <p className="text-[11px] text-white/70">Your GCash income</p>
          </div>
          <Coins className="h-8 w-8 text-white/30" />
        </div>
      </div>

      {/* Filters + add */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FinanceFilters range={range} onRangeChange={changeRange} isOwner={isOwner} storeId={storeId} onStoreChange={changeStore} />
        <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-1" /> GCash Transaction
        </Button>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border divide-y">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Smartphone className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No GCash transactions for this period</p>
          </div>
        ) : (
          transactions.map(t => {
            const isIn = t.type === 'cash_in'
            const Icon = isIn ? ArrowDownToLine : ArrowUpFromLine
            return (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${isIn ? 'bg-blue-100 text-blue-600' : 'bg-cyan-100 text-cyan-700'}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{formatCurrency(t.amount)}</span>
                    <Badge variant="outline" className="text-[10px]">{GCASH_TYPE_LABELS[t.type].label}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {formatTime(t.created_at)}
                    {t.customer_name && ` · ${t.customer_name}`}
                    {t.reference_number && ` · Ref ${t.reference_number}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-green-600">+{formatCurrency(t.fee)}</p>
                  <p className="text-[10px] text-gray-400">fee</p>
                </div>
                {isOwner && (
                  <button onClick={() => handleDelete(t)} className="p-1.5 text-gray-400 hover:text-red-600" aria-label="Delete transaction">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>

      <GcashDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={reload}
        storeId={isOwner && storeId !== ALL_STORES ? storeId : null}
      />
    </div>
  )
}
