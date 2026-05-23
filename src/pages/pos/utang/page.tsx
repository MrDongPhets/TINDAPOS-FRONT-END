import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApiClient } from '@/hooks/useApiClient'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from '@/components/ui/sheet'
import {
  ArrowLeft, Search, Plus, HandCoins, ChevronRight, Loader2,
  AlertCircle, X, TrendingUp, TrendingDown, Clock, User, PhoneCall
} from 'lucide-react'

type Customer = {
  id: string
  name: string
  phone: string | null
  notes: string | null
  balance: number
}

type LedgerEntry = {
  id: string
  type: 'charge' | 'payment'
  amount: number
  notes: string | null
  created_at: string
}

export default function StaffUtangPage() {
  const { get, post } = useApiClient()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [customers,    setCustomers]    = useState<Customer[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [saving,       setSaving]       = useState(false)

  // New customer modal
  const [showNew,      setShowNew]      = useState(false)
  const [newName,      setNewName]      = useState('')
  const [newPhone,     setNewPhone]     = useState('')
  const [newNotes,     setNewNotes]     = useState('')
  const [newError,     setNewError]     = useState('')

  // Customer detail sheet
  const [selected,     setSelected]     = useState<Customer | null>(null)
  const [ledger,       setLedger]       = useState<LedgerEntry[]>([])
  const [ledgerLoad,   setLedgerLoad]   = useState(false)

  // Charge / Payment modal
  const [txType,       setTxType]       = useState<'charge' | 'payment' | null>(null)
  const [txAmount,     setTxAmount]     = useState('')
  const [txNotes,      setTxNotes]      = useState('')
  const [txError,      setTxError]      = useState('')

  useEffect(() => { fetchCustomers() }, [])

  const fetchCustomers = async () => {
    setLoading(true)
    const res = await get('/pos/utang/customers')
    if (res?.success) setCustomers(res.data?.customers || [])
    setLoading(false)
  }

  const openCustomer = async (c: Customer) => {
    setSelected(c)
    setLedgerLoad(true)
    const res = await get(`/pos/utang/customers/${c.id}/ledger`)
    if (res?.success) {
      setSelected(res.data?.customer)
      setLedger(res.data?.entries || [])
    }
    setLedgerLoad(false)
  }

  const handleNewCustomer = async () => {
    setNewError('')
    if (!newName.trim()) { setNewError('Customer name is required'); return }
    setSaving(true)
    const res = await post('/pos/utang/customers', { name: newName.trim(), phone: newPhone.trim() || null, notes: newNotes.trim() || null })
    setSaving(false)
    if (res?.success) {
      toast({ title: 'Customer added' })
      setShowNew(false); setNewName(''); setNewPhone(''); setNewNotes('')
      fetchCustomers()
    } else {
      setNewError(res?.error || 'Failed to add customer')
    }
  }

  const handleTransaction = async () => {
    setTxError('')
    if (!txAmount || Number(txAmount) <= 0) { setTxError('Enter a valid amount'); return }
    if (!selected) return
    setSaving(true)
    const endpoint = `/pos/utang/customers/${selected.id}/${txType}`
    const res = await post(endpoint, { amount: parseFloat(txAmount), notes: txNotes.trim() || null })
    setSaving(false)
    if (res?.success) {
      toast({ title: txType === 'charge' ? 'Utang recorded' : 'Payment recorded' })
      setTxType(null); setTxAmount(''); setTxNotes('')
      // Refresh ledger and customer list
      await openCustomer(selected)
      fetchCustomers()
    } else {
      setTxError(res?.error || 'Failed to record transaction')
    }
  }

  const filtered = search.trim()
    ? customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search)
      )
    : customers

  const totalDebt = customers.reduce((s, c) => s + Math.max(c.balance, 0), 0)

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate('/pos/dashboard')} className="text-gray-500 hover:text-gray-700 p-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-lg leading-tight">Utang Tracker</h1>
          <p className="text-xs text-gray-400">
            {customers.length} customer{customers.length !== 1 ? 's' : ''} · Total debt: {formatCurrency(totalDebt)}
          </p>
        </div>
        <Button size="sm" className="bg-[#E8302A] hover:bg-[#B91C1C] gap-1.5 shrink-0"
          onClick={() => { setNewError(''); setShowNew(true) }}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 bg-white border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search by name or phone..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-9 h-9 text-sm" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 pt-3 space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border flex items-center gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="h-5 w-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <HandCoins className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-500">
              {search ? 'No customers found' : 'No customers yet'}
            </p>
            {!search && (
              <Button variant="outline" className="mt-4 gap-2" onClick={() => setShowNew(true)}>
                <Plus className="h-4 w-4" /> Add First Customer
              </Button>
            )}
          </div>
        ) : (
          filtered
            .sort((a, b) => b.balance - a.balance)
            .map(c => (
              <button key={c.id} onClick={() => openCustomer(c)}
                className="w-full bg-white rounded-xl border p-4 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left shadow-sm">
                <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <span className="text-[#E8302A] font-bold text-base">{c.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{c.name}</p>
                  {c.phone && <p className="text-xs text-gray-400 truncate">{c.phone}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-bold text-sm ${c.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {c.balance > 0 ? formatCurrency(c.balance) : 'Settled'}
                  </p>
                  {c.balance > 0 && <p className="text-[10px] text-gray-400">outstanding</p>}
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
              </button>
            ))
        )}
      </div>

      {/* Customer Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={v => { if (!v) { setSelected(null); setLedger([]) } }}>
        <SheetContent side="bottom" className="max-h-[90vh] rounded-t-2xl px-0 pb-[env(safe-area-inset-bottom,16px)] flex flex-col">
          {selected && (
            <>
              <SheetHeader className="px-4 pb-3 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <SheetTitle className="text-lg">{selected.name}</SheetTitle>
                    {selected.phone && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                        <PhoneCall className="h-3 w-3" /> {selected.phone}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${(selected as any).balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency((selected as any).balance || 0)}
                    </p>
                    <p className="text-xs text-gray-400">current balance</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-3">
                  <Button className="flex-1 bg-red-500 hover:bg-red-600 gap-2"
                    onClick={() => { setTxType('charge'); setTxAmount(''); setTxNotes(''); setTxError('') }}>
                    <TrendingUp className="h-4 w-4" /> Add Utang
                  </Button>
                  <Button className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                    onClick={() => { setTxType('payment'); setTxAmount(''); setTxNotes(''); setTxError('') }}>
                    <TrendingDown className="h-4 w-4" /> Record Payment
                  </Button>
                </div>
              </SheetHeader>

              {/* Ledger */}
              <div className="flex-1 overflow-y-auto px-4 pt-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Transaction History</p>
                {ledgerLoad ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  </div>
                ) : ledger.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">No transactions yet</div>
                ) : (
                  <div className="space-y-2 pb-4">
                    {ledger.map(entry => (
                      <div key={entry.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                          entry.type === 'charge' ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          {entry.type === 'charge'
                            ? <TrendingUp className="h-4 w-4 text-red-600" />
                            : <TrendingDown className="h-4 w-4 text-green-600" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {entry.type === 'charge' ? 'Utang' : 'Payment'}
                          </p>
                          {entry.notes && <p className="text-xs text-gray-400 truncate">{entry.notes}</p>}
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                            <Clock className="h-3 w-3" /> {formatDate(entry.created_at)}
                          </div>
                        </div>
                        <p className={`font-semibold text-sm shrink-0 ${
                          entry.type === 'charge' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {entry.type === 'charge' ? '+' : '-'}{formatCurrency(entry.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Charge / Payment Dialog */}
      <Dialog open={!!txType} onOpenChange={v => { if (!v) setTxType(null) }}>
        <DialogContent onOpenAutoFocus={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {txType === 'charge' ? '➕ Add Utang' : '💰 Record Payment'}
              {selected && <span className="text-gray-500 font-normal"> — {selected.name}</span>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Amount *</Label>
              <Input type="number" min="0.01" step="0.01" placeholder="0.00"
                value={txAmount} onChange={e => setTxAmount(e.target.value)}
                className="text-lg font-semibold" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Notes <span className="text-gray-400">(optional)</span></Label>
              <Input placeholder={txType === 'charge' ? 'e.g. Grocery items' : 'e.g. Cash payment'}
                value={txNotes} onChange={e => setTxNotes(e.target.value)} />
            </div>
            {txError && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="h-4 w-4 shrink-0" /> {txError}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTxType(null)}>Cancel</Button>
            <Button onClick={handleTransaction} disabled={saving}
              className={txType === 'charge' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : txType === 'charge' ? 'Add Utang' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Customer Dialog */}
      <Dialog open={showNew} onOpenChange={v => { if (!v) setShowNew(false) }}>
        <DialogContent onOpenAutoFocus={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input placeholder="Customer name" value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone <span className="text-gray-400">(optional)</span></Label>
              <Input placeholder="09xxxxxxxxx" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes <span className="text-gray-400">(optional)</span></Label>
              <Input placeholder="Any notes about this customer" value={newNotes} onChange={e => setNewNotes(e.target.value)} />
            </div>
            {newError && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="h-4 w-4 shrink-0" /> {newError}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleNewCustomer} disabled={saving} className="bg-[#E8302A] hover:bg-[#B91C1C]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
