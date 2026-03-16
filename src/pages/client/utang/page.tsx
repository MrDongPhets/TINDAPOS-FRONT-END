import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppSidebar } from '@/components/ui/app-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/components/auth/AuthProvider'
import API_CONFIG from '@/config/api'

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
  'Content-Type': 'application/json',
})
import {
  HandCoins,
  Plus,
  Search,
  ChevronRight,
  ArrowDownCircle,
  ArrowUpCircle,
  Receipt,
  Phone,
  User,
  Loader2,
} from 'lucide-react'

function formatCurrency(amount: number) {
  return `₱${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function UtangPage() {
  const { user, company } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', phone: '', notes: '' })
  const [addLoading, setAddLoading] = useState(false)

  // Ledger sheet
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [ledger, setLedger] = useState<any[]>([])
  const [ledgerLoading, setLedgerLoading] = useState(false)
  const [showLedger, setShowLedger] = useState(false)

  // Payment dialog
  const [showPayment, setShowPayment] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [paymentLoading, setPaymentLoading] = useState(false)

  // Charge dialog
  const [showCharge, setShowCharge] = useState(false)
  const [chargeAmount, setChargeAmount] = useState('')
  const [chargeNotes, setChargeNotes] = useState('')
  const [chargeLoading, setChargeLoading] = useState(false)

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_CONFIG.BASE_URL}/client/utang/customers`, { headers: getAuthHeaders() })
      const data = await res.json()
      setCustomers(data.customers || [])
    } catch {
      toast({ title: 'Failed to load customers', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const fetchLedger = async (customer: any) => {
    setSelectedCustomer(customer)
    setShowLedger(true)
    setLedgerLoading(true)
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/client/utang/customers/${customer.id}/ledger`, { headers: getAuthHeaders() })
      const data = await res.json()
      setLedger(data.entries || [])
      setSelectedCustomer(data.customer)
    } catch {
      toast({ title: 'Failed to load ledger', variant: 'destructive' })
    } finally {
      setLedgerLoading(false)
    }
  }

  const handleAddCustomer = async () => {
    if (!addForm.name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' })
      return
    }
    setAddLoading(true)
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/client/utang/customers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(addForm)
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: 'Customer added' })
      setShowAddDialog(false)
      setAddForm({ name: '', phone: '', notes: '' })
      fetchCustomers()
    } catch (err: any) {
      toast({ title: err.message || 'Failed to add customer', variant: 'destructive' })
    } finally {
      setAddLoading(false)
    }
  }

  const handleRecordPayment = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast({ title: 'Enter a valid amount', variant: 'destructive' })
      return
    }
    if (Number(paymentAmount) > selectedCustomer.balance) {
      toast({ title: 'Amount exceeds outstanding balance', variant: 'destructive' })
      return
    }
    setPaymentLoading(true)
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/client/utang/customers/${selectedCustomer.id}/payment`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount: Number(paymentAmount), notes: paymentNotes })
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: 'Payment recorded successfully' })
      setShowPayment(false)
      setPaymentAmount('')
      setPaymentNotes('')
      fetchLedger(selectedCustomer)
      fetchCustomers()
    } catch (err: any) {
      toast({ title: err.message || 'Failed to record payment', variant: 'destructive' })
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleRecordCharge = async () => {
    if (!chargeAmount || Number(chargeAmount) <= 0) {
      toast({ title: 'Enter a valid amount', variant: 'destructive' })
      return
    }
    setChargeLoading(true)
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/client/utang/customers/${selectedCustomer.id}/charge`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount: Number(chargeAmount), notes: chargeNotes })
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: 'Utang recorded successfully' })
      setShowCharge(false)
      setChargeAmount('')
      setChargeNotes('')
      fetchLedger(selectedCustomer)
      fetchCustomers()
    } catch (err: any) {
      toast({ title: err.message || 'Failed to record utang', variant: 'destructive' })
    } finally {
      setChargeLoading(false)
    }
  }

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  )

  const totalOutstanding = customers.reduce((sum, c) => sum + Math.max(0, c.balance), 0)
  const customersWithDebt = customers.filter(c => c.balance > 0).length

  return (
    <SidebarProvider>
      <AppSidebar userType="client" user={user} company={company} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 overflow-hidden">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center justify-between overflow-hidden">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold truncate">Utang Tracker</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">Track customer credit & debt</p>
            </div>
            <Button onClick={() => setShowAddDialog(true)} className="bg-[#E8302A] hover:bg-[#B91C1C] shrink-0 ml-2">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Customer</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </header>

        <div className="p-4 space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Outstanding</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Customers with Debt</p>
                <p className="text-xl font-bold">{customersWithDebt}</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Customer List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <HandCoins className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">{search ? 'No customers found' : 'No customers yet'}</p>
              {!search && <p className="text-sm mt-1">Add a customer to start tracking utang</p>}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(customer => (
                <button
                  key={customer.id}
                  className="w-full text-left bg-white border rounded-lg p-4 hover:bg-gray-50 transition-colors flex items-center justify-between gap-3"
                  onClick={() => fetchLedger(customer)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{customer.name}</p>
                      {customer.phone && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" />{customer.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {customer.balance > 0 ? (
                      <Badge variant="destructive" className="font-semibold">
                        {formatCurrency(customer.balance)}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-green-700 bg-green-100">
                        Paid
                      </Badge>
                    )}
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Add Customer Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Customer</DialogTitle>
              <DialogDescription>Add a customer to track their utang</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Name *</Label>
                <Input
                  placeholder="Customer name"
                  value={addForm.name}
                  onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  placeholder="Phone number (optional)"
                  value={addForm.phone}
                  onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Input
                  placeholder="Notes (optional)"
                  value={addForm.notes}
                  onChange={e => setAddForm(p => ({ ...p, notes: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleAddCustomer} disabled={addLoading} className="flex-1 bg-[#E8302A] hover:bg-[#B91C1C]">
                  {addLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Customer'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Ledger Sheet */}
        <Sheet open={showLedger} onOpenChange={setShowLedger}>
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader className="pb-4 border-b">
              <SheetTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {selectedCustomer?.name}
              </SheetTitle>
              {selectedCustomer?.phone && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Phone className="h-3 w-3" />{selectedCustomer.phone}
                </p>
              )}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-sm text-gray-500">Outstanding Balance</p>
                  <p className={`text-2xl font-bold ${(selectedCustomer?.balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(selectedCustomer?.balance || 0)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowCharge(true)} className="border-red-300 text-red-700">
                    <ArrowUpCircle className="h-4 w-4 mr-1" />
                    Utang
                  </Button>
                  {(selectedCustomer?.balance || 0) > 0 && (
                    <Button onClick={() => setShowPayment(true)} className="bg-[#E8302A] hover:bg-[#B91C1C]">
                      <ArrowDownCircle className="h-4 w-4 mr-1" />
                      Pay
                    </Button>
                  )}
                </div>
              </div>
            </SheetHeader>

            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-500">Transaction History</p>
              {ledgerLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : ledger.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">No transactions yet</p>
              ) : (
                ledger.map(entry => (
                  <div key={entry.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      {entry.type === 'charge' ? (
                        <ArrowUpCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                      ) : (
                        <ArrowDownCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {entry.type === 'charge' ? 'Charged' : 'Payment'}
                        </p>
                        {entry.sale_id && (
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Receipt className="h-3 w-3" />POS Sale
                          </p>
                        )}
                        {entry.notes && <p className="text-xs text-gray-400">{entry.notes}</p>}
                        <p className="text-xs text-gray-400">{formatDate(entry.created_at)}</p>
                      </div>
                    </div>
                    <span className={`font-semibold text-sm ${entry.type === 'charge' ? 'text-red-600' : 'text-green-600'}`}>
                      {entry.type === 'charge' ? '+' : '-'}{formatCurrency(entry.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Record Charge (Utang) Dialog */}
        <Dialog open={showCharge} onOpenChange={setShowCharge}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Utang</DialogTitle>
              <DialogDescription>
                Manually record a debt for {selectedCustomer?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Amount *</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={chargeAmount}
                  onChange={e => setChargeAmount(e.target.value)}
                  className="mt-1 text-lg font-bold"
                  autoFocus
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Input
                  placeholder="e.g. Bought groceries (optional)"
                  value={chargeNotes}
                  onChange={e => setChargeNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowCharge(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleRecordCharge} disabled={chargeLoading} className="flex-1 bg-[#E8302A] hover:bg-[#B91C1C]">
                  {chargeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Utang'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Record Payment Dialog */}
        <Dialog open={showPayment} onOpenChange={setShowPayment}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                {selectedCustomer?.name} — Outstanding: {formatCurrency(selectedCustomer?.balance || 0)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Amount *</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  className="mt-1 text-lg font-bold"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 text-xs text-gray-500"
                  onClick={() => setPaymentAmount(String(selectedCustomer?.balance || ''))}
                >
                  Pay full balance ({formatCurrency(selectedCustomer?.balance || 0)})
                </Button>
              </div>
              <div>
                <Label>Notes</Label>
                <Input
                  placeholder="Notes (optional)"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowPayment(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleRecordPayment} disabled={paymentLoading} className="flex-1 bg-[#E8302A] hover:bg-[#B91C1C]">
                  {paymentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Record Payment'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
