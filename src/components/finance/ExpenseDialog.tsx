import { useState } from 'react'
import { useApiClient } from '@/hooks/useApiClient'
import { useToast } from '@/components/ui/use-toast'
import API_CONFIG from '@/config/api'
import { EXPENSE_CATEGORIES, EXPENSE_PAYMENT_METHODS, localDate } from '@/lib/finance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Receipt } from 'lucide-react'

const { EXPENSES } = API_CONFIG.ENDPOINTS.FINANCE

export type Expense = {
  id: string
  store_id: string | null
  category: string
  description: string | null
  amount: number | string
  expense_date: string
  payment_method: string
  staff_id: string | null
  created_at: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
  storeId?: string | null  // owner's selected store (new expenses); staff are always their own store
  expense?: Expense | null // edit mode (owner only)
}

export function ExpenseDialog({ open, onOpenChange, onSaved, storeId, expense }: Props) {
  const { post, put } = useApiClient()
  const { toast } = useToast()

  // Parent mounts this per open (keyed by expense), so initial state = the expense being edited, or blank
  const [category, setCategory] = useState(expense?.category ?? 'supplies')
  const [description, setDescription] = useState(expense?.description ?? '')
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '')
  const [date, setDate] = useState(expense ? expense.expense_date.slice(0, 10) : localDate())
  const [paymentMethod, setPaymentMethod] = useState(expense?.payment_method ?? 'cash')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setError('')
    if (!(Number(amount) > 0)) { setError('Enter a valid amount'); return }

    const body = {
      category,
      description: description.trim() || null,
      amount: Number(amount),
      expense_date: date,
      payment_method: paymentMethod,
      store_id: expense ? expense.store_id : storeId || null,
    }

    setSaving(true)
    const res = expense ? await put(`${EXPENSES}/${expense.id}`, body) : await post(EXPENSES, body)
    setSaving(false)

    if (res?.success) {
      toast({ title: expense ? 'Expense updated' : 'Expense recorded' })
      onOpenChange(false)
      onSaved?.()
    } else {
      setError(res?.error || 'Failed to save expense')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-[#E8302A]" /> {expense ? 'Edit Expense' : 'Add Expense'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="expense-amount">Amount</Label>
            <Input
              id="expense-amount"
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

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expense-description">Description (optional)</Label>
            <Input
              id="expense-description"
              placeholder="e.g. 2 sako ng yelo, Meralco bill"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="expense-date">Date</Label>
              <Input id="expense-date" type="date" value={date} max={localDate()} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Paid with</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !(Number(amount) > 0)} className="bg-[#E8302A] hover:bg-[#B91C1C]">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {expense ? 'Save Changes' : 'Add Expense'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
