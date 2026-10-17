import { useEffect, useState } from 'react'
import { useApiClient } from '@/hooks/useApiClient'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency } from '@/lib/utils'
import API_CONFIG from '@/config/api'
import { expenseCategoryLabel, rangeFor, type RangePreset } from '@/lib/finance'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ALL_STORES, FinanceFilters } from './FinanceFilters'
import { ExpenseDialog, type Expense } from './ExpenseDialog'
import { Loader2, Pencil, Plus, Receipt, Trash2, Wallet } from 'lucide-react'

const { EXPENSES } = API_CONFIG.ENDPOINTS.FINANCE

type Summary = { count: number; total: number; by_category: Record<string, number> }

const EMPTY_SUMMARY: Summary = { count: 0, total: 0, by_category: {} }

// Expenses list + summary. Owner: store filter, edit, delete. Staff: own store, add only.
export function ExpensesView({ isOwner }: { isOwner: boolean }) {
  const { get, delete: del } = useApiClient()
  const { toast } = useToast()

  const [range, setRange] = useState<RangePreset>('month')
  const [storeId, setStoreId] = useState(ALL_STORES)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)

  const [reloadKey, setReloadKey] = useState(0)

  // Refetch after a change (filters / save / delete) — loading is set here, not inside the effect
  const reload = () => { setLoading(true); setReloadKey(k => k + 1) }
  const changeRange = (r: RangePreset) => { setLoading(true); setRange(r) }
  const changeStore = (id: string) => { setLoading(true); setStoreId(id) }

  useEffect(() => {
    let cancelled = false
    const { start, end } = rangeFor(range)
    const params = new URLSearchParams()
    if (start) params.set('start_date', start)
    if (end) params.set('end_date', end)
    if (isOwner && storeId !== ALL_STORES) params.set('store_id', storeId)
    params.set('_', String(Date.now()))

    get(`${EXPENSES}?${params}`).then(res => {
      if (cancelled) return
      if (res?.success) {
        setExpenses(res.data?.expenses || [])
        setSummary(res.data?.summary || EMPTY_SUMMARY)
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [get, range, storeId, isOwner, reloadKey])

  const openNew = () => { setEditing(null); setDialogOpen(true) }
  const openEdit = (e: Expense) => { setEditing(e); setDialogOpen(true) }

  const handleDelete = async (e: Expense) => {
    if (!window.confirm(`Delete this expense of ${formatCurrency(e.amount)}?`)) return
    const res = await del(`${EXPENSES}/${e.id}`)
    if (res?.success) {
      toast({ title: 'Expense deleted' })
      reload()
    } else {
      toast({ title: 'Failed to delete', description: res?.error, variant: 'destructive' })
    }
  }

  const topCategories = Object.entries(summary.by_category).sort((a, b) => b[1] - a[1]).slice(0, 3)

  const formatDate = (d: string) =>
    new Date(`${d.slice(0, 10)}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-3.5 shadow-sm text-white flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-white/80">Total Expenses</p>
            <p className="text-xl font-bold mt-0.5">{formatCurrency(summary.total)}</p>
            <p className="text-[11px] text-white/70">{summary.count} item{summary.count === 1 ? '' : 's'}</p>
          </div>
          <Wallet className="h-8 w-8 text-white/30" />
        </div>
        <div className="bg-white rounded-2xl border p-3.5">
          <p className="text-xs font-medium text-gray-500 mb-1.5">Biggest expenses</p>
          {topCategories.length === 0 ? (
            <p className="text-sm text-gray-400">—</p>
          ) : (
            <div className="space-y-1">
              {topCategories.map(([cat, total]) => (
                <div key={cat} className="flex justify-between text-sm">
                  <span className="text-gray-700 truncate">{expenseCategoryLabel(cat)}</span>
                  <span className="font-semibold">{formatCurrency(total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filters + add */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FinanceFilters range={range} onRangeChange={changeRange} isOwner={isOwner} storeId={storeId} onStoreChange={changeStore} />
        <Button onClick={openNew} className="bg-[#E8302A] hover:bg-[#B91C1C]">
          <Plus className="h-4 w-4 mr-1" /> Add Expense
        </Button>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border divide-y">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Receipt className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No expenses for this period</p>
          </div>
        ) : (
          expenses.map(e => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-3">
              <div className="h-9 w-9 rounded-full bg-red-50 text-[#E8302A] flex items-center justify-center shrink-0">
                <Receipt className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">{expenseCategoryLabel(e.category)}</span>
                  {e.payment_method !== 'cash' && <Badge variant="outline" className="text-[10px] uppercase">{e.payment_method}</Badge>}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {formatDate(e.expense_date)}{e.description && ` · ${e.description}`}
                </p>
              </div>
              <span className="font-semibold text-red-600 shrink-0">−{formatCurrency(e.amount)}</span>
              {isOwner && (
                <div className="flex shrink-0">
                  <button onClick={() => openEdit(e)} className="p-1.5 text-gray-400 hover:text-gray-700" aria-label="Edit expense">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(e)} className="p-1.5 text-gray-400 hover:text-red-600" aria-label="Delete expense">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Mounted only while open, keyed per expense, so the form starts fresh each time */}
      {dialogOpen && (
        <ExpenseDialog
          key={editing?.id ?? 'new'}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSaved={reload}
          expense={editing}
          storeId={isOwner && storeId !== ALL_STORES ? storeId : null}
        />
      )}
    </div>
  )
}
