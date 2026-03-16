'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Banknote, Building, Smartphone, Loader2, HandCoins, Search, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import API_CONFIG from '@/config/api'

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
  'Content-Type': 'application/json',
})

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: Banknote, color: 'bg-green-50 border-green-200 hover:bg-green-100' },
  { id: 'card', label: 'Card', icon: CreditCard, color: 'bg-blue-50 border-blue-200 hover:bg-blue-100' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: Building, color: 'bg-purple-50 border-purple-200 hover:bg-purple-100' },
  { id: 'e_wallet', label: 'E-Wallet', icon: Smartphone, color: 'bg-orange-50 border-orange-200 hover:bg-orange-100' },
  { id: 'credit', label: 'Utang', icon: HandCoins, color: 'bg-red-50 border-red-200 hover:bg-red-100' },
]

export default function PaymentModal({ open, onClose, onSubmit, total, loading }) {
  const [selectedMethod, setSelectedMethod] = useState('cash')
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', notes: '' })
  const [cashReceived, setCashReceived] = useState('')
  // Utang: customer search
  const [customerSearch, setCustomerSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [searching, setSearching] = useState(false)
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')

  useEffect(() => {
    if (!open) {
      setSelectedMethod('cash')
      setCustomerInfo({ name: '', phone: '', notes: '' })
      setCashReceived('')
      setCustomerSearch('')
      setSearchResults([])
      setSelectedCustomer(null)
      setShowNewCustomer(false)
      setNewCustomerName('')
      setNewCustomerPhone('')
    }
  }, [open])

  useEffect(() => {
    if (selectedMethod !== 'credit' || customerSearch.length < 1) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/client/utang/customers/search?q=${encodeURIComponent(customerSearch)}`, {
          headers: getAuthHeaders()
        })
        const data = await res.json()
        setSearchResults(data.customers || [])
      } catch { setSearchResults([]) }
      finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [customerSearch, selectedMethod])

  const handleSubmit = () => {
    if (selectedMethod === 'credit' && !selectedCustomer && !showNewCustomer) {
      alert('Please select or create a customer for utang')
      return
    }
    if (selectedMethod === 'credit' && showNewCustomer && !newCustomerName.trim()) {
      alert('Customer name is required')
      return
    }
    onSubmit(selectedMethod, customerInfo, selectedCustomer, showNewCustomer ? { name: newCustomerName, phone: newCustomerPhone } : null)
  }

  const handleInputChange = (field, value) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const calculateChange = () => {
    const received = parseFloat(cashReceived) || 0
    return received - total
  }

  const change = calculateChange()

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            Total Amount: <span className="text-2xl font-bold text-blue-600">{formatCurrency(total)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Methods */}
          <div>
            <Label className="mb-3 block">Select Payment Method</Label>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon
                return (
                  <Card
                    key={method.id}
                    className={`
                      cursor-pointer transition-all p-4 border-2
                      ${method.color}
                      ${selectedMethod === method.id ? 'ring-2 ring-blue-500 border-blue-500' : ''}
                    `}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-6 w-6" />
                      <span className="font-medium">{method.label}</span>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Cash Calculation */}
          {selectedMethod === 'cash' && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <Label htmlFor="cashReceived">Cash Received</Label>
              <Input
                id="cashReceived"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="mt-2 text-lg font-bold"
                autoFocus
              />
              {cashReceived && (
                <div className="mt-3 p-3 bg-white rounded border border-green-300">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Change:</span>
                    <span className={`text-xl font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(change))}
                    </span>
                  </div>
                  {change < 0 && (
                    <p className="text-xs text-red-600 mt-1">Insufficient amount received</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Utang Customer Selector */}
          {selectedMethod === 'credit' && (
            <div className="space-y-3 bg-red-50 p-4 rounded-lg border border-red-200">
              <Label className="text-red-700 font-semibold">Select Customer for Utang</Label>
              {selectedCustomer ? (
                <div className="flex items-center justify-between bg-white p-3 rounded border border-red-300">
                  <div>
                    <p className="font-medium">{selectedCustomer.name}</p>
                    {selectedCustomer.phone && <p className="text-sm text-gray-500">{selectedCustomer.phone}</p>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedCustomer(null); setCustomerSearch('') }}>Change</Button>
                </div>
              ) : showNewCustomer ? (
                <div className="space-y-2">
                  <Input placeholder="Customer Name *" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} />
                  <Input placeholder="Phone (optional)" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} />
                  <Button variant="ghost" size="sm" onClick={() => setShowNewCustomer(false)}>← Back to search</Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name or phone..."
                      value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {searching && <p className="text-xs text-gray-500">Searching...</p>}
                  {searchResults.length > 0 && (
                    <div className="border rounded-md bg-white divide-y max-h-36 overflow-y-auto">
                      {searchResults.map((c: any) => (
                        <button key={c.id} className="w-full text-left px-3 py-2 hover:bg-red-50 text-sm" onClick={() => { setSelectedCustomer(c); setSearchResults([]) }}>
                          <span className="font-medium">{c.name}</span>
                          {c.phone && <span className="text-gray-400 ml-2">{c.phone}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="w-full border-red-300 text-red-700" onClick={() => setShowNewCustomer(true)}>
                    <UserPlus className="h-4 w-4 mr-2" /> New Customer
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Customer Information (non-credit methods) */}
          {selectedMethod !== 'credit' && (
            <div className="space-y-3">
              <Label>Customer Information (Optional)</Label>
              <Input
                placeholder="Customer Name"
                value={customerInfo.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
              <Input
                placeholder="Phone Number"
                value={customerInfo.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
              <Textarea
                placeholder="Notes"
                value={customerInfo.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={2}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                loading ||
                (selectedMethod === 'cash' && change < 0) ||
                (selectedMethod === 'credit' && !selectedCustomer && !showNewCustomer) ||
                (selectedMethod === 'credit' && showNewCustomer && !newCustomerName.trim())
              }
              className="flex-1 bg-[#E8302A] hover:bg-[#B91C1C]"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Complete Payment
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}