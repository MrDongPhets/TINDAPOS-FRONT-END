import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApiClient } from '@/hooks/useApiClient'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Receipt, Loader2, AlertCircle, TrendingUp, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import ReceiptModal from '@/pages/client/pos/components/ReceiptModal'

type SaleSummary = {
  id: string
  receipt_number: string
  total_amount: number
  subtotal: number
  discount_amount: number
  discount_type: string | null
  tax_amount: number
  vatable_amount: number
  vat_exempt_amount: number
  zero_rated_amount: number
  payment_method: string
  customer_name: string | null
  or_number: string
  items_count: number
  created_at: string
  notes: string | null
}

const paymentColor = (m: string) => {
  if (m === 'cash')  return 'bg-green-100 text-green-700'
  if (m === 'card')  return 'bg-blue-100 text-blue-700'
  if (m === 'gcash' || m === 'maya') return 'bg-purple-100 text-purple-700'
  return 'bg-gray-100 text-gray-600'
}

export default function StaffSalesPage() {
  const { get } = useApiClient()
  const navigate = useNavigate()

  const [sales,      setSales]      = useState<SaleSummary[]>([])
  const [total,      setTotal]      = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [search,     setSearch]     = useState('')
  const [store,      setStore]      = useState<any>(null)

  // Receipt modal state
  const [receiptOpen,    setReceiptOpen]    = useState(false)
  const [receiptSale,    setReceiptSale]    = useState<any>(null)
  const [receiptItems,   setReceiptItems]   = useState<any[]>([])
  const [receiptLoading, setReceiptLoading] = useState(false)

  const storeId = localStorage.getItem('selectedStoreId') || ''

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const storeParam = storeId ? `?store_id=${storeId}` : ''
      const [salesRes, storesRes] = await Promise.all([
        get(`/pos/sales/today${storeParam}`),
        get('/pos/stores'),
      ])
      if (salesRes?.success) {
        setSales(salesRes.data?.sales || [])
        setTotal(salesRes.data?.total || 0)
      } else {
        setError(salesRes?.error || 'Failed to load sales')
      }
      if (storesRes?.success) {
        const stores = storesRes.data?.stores || []
        const matched = stores.find((s: any) => s.id === storeId) || stores[0]
        if (matched) setStore(matched)
      }
      setLoading(false)
    }
    init()
  }, [])

  const openReceipt = async (sale: SaleSummary) => {
    setReceiptLoading(true)
    setReceiptOpen(true)
    const res = await get(`/pos/sales/receipt/${sale.receipt_number}`)
    setReceiptLoading(false)
    if (res?.success) {
      const full = res.data?.sale
      setReceiptSale(full)
      setReceiptItems(
        (full?.sales_items || []).map((i: any) => ({
          id: i.product_id,
          name: i.products?.name || i.product_name || 'Item',
          quantity: i.quantity,
          price: i.unit_price,
          image_url: i.products?.image_url || null,
          product_type: i.product_type || 'simple',
        }))
      )
    }
  }

  const today = new Date().toLocaleDateString('en-PH', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  })

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })

  const filtered = search.trim()
    ? sales.filter(s =>
        s.receipt_number.toLowerCase().includes(search.toLowerCase()) ||
        s.or_number?.toLowerCase().includes(search.toLowerCase()) ||
        s.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.payment_method.toLowerCase().includes(search.toLowerCase())
      )
    : sales

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate('/pos/dashboard')} className="text-gray-500 hover:text-gray-700 p-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-lg leading-tight">Sales History</h1>
          <p className="text-xs text-gray-400 truncate">{today}</p>
        </div>
        {!loading && (
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-[#E8302A]">{formatCurrency(total)}</p>
            <p className="text-xs text-gray-400">{sales.length} transaction{sales.length !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="px-4 py-3 bg-white border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by receipt, customer, payment..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-9 h-9 text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 pt-3 space-y-2">
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border flex items-center gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="h-4 w-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-500">
              {search ? 'No results found' : 'No transactions today'}
            </p>
            {!search && <p className="text-sm mt-1">Transactions will appear here after checkout</p>}
          </div>
        ) : (
          filtered.map((sale, i) => (
            <button
              key={sale.id}
              onClick={() => openReceipt(sale)}
              className="w-full bg-white rounded-xl border p-4 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left shadow-sm"
            >
              {/* Icon */}
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <Receipt className="h-5 w-5 text-[#E8302A]" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">{sale.receipt_number}</p>
                  {sale.discount_type && (
                    <Badge className="bg-yellow-100 text-yellow-700 border-0 text-[10px] px-1.5 shrink-0">
                      {sale.discount_type === 'senior_citizen' ? 'SC' : sale.discount_type === 'pwd' ? 'PWD' : 'DISC'}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{formatTime(sale.created_at)}</span>
                  {sale.customer_name && (
                    <>
                      <span className="text-gray-200">•</span>
                      <span className="text-xs text-gray-500 truncate">{sale.customer_name}</span>
                    </>
                  )}
                  <span className="text-gray-200">•</span>
                  <span className="text-xs text-gray-400">{sale.items_count} item{sale.items_count !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Amount + payment */}
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-gray-900">{formatCurrency(sale.total_amount)}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${paymentColor(sale.payment_method)}`}>
                  {sale.payment_method?.toUpperCase()}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Receipt Modal */}
      {receiptOpen && (
        receiptLoading ? (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-[#E8302A]" />
              <p className="text-sm text-gray-600">Loading receipt...</p>
            </div>
          </div>
        ) : (
          <ReceiptModal
            open={receiptOpen}
            onClose={() => { setReceiptOpen(false); setReceiptSale(null) }}
            sale={receiptSale}
            store={store}
            onNewSale={() => { setReceiptOpen(false); setReceiptSale(null) }}
            cartItems={receiptItems}
          />
        )
      )}
    </div>
  )
}
