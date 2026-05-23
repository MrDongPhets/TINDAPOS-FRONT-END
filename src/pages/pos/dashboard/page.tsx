import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApiClient } from '@/hooks/useApiClient'
import { useAuth } from '@/components/auth/AuthProvider'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ShoppingCart, ClipboardList, LogOut, Store,
  TrendingUp, Receipt, Loader2, Clock,
  ChevronRight, User, Fingerprint, Timer
} from 'lucide-react'

type Sale = {
  id: string
  receipt_number: string
  total_amount: number
  payment_method: string
  created_at: string
  items_count?: number
}

export default function StaffDashboardPage() {
  const { get } = useApiClient()
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [todaySales, setTodaySales] = useState<Sale[]>([])
  const [todayTotal, setTodayTotal] = useState(0)
  const [pendingCounts, setPendingCounts] = useState(0)
  const [storeName, setStoreName] = useState('')
  const [now, setNow] = useState(new Date())
  const [clockedIn, setClockedIn] = useState(false)
  const [clockInTime, setClockInTime] = useState<string | null>(null)

  const staffData = (() => {
    try { return JSON.parse(localStorage.getItem('staffData') || '{}') } catch { return {} }
  })()
  const storeId = localStorage.getItem('selectedStoreId') || staffData?.store_id || ''

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const storeParam = storeId ? `?store_id=${storeId}` : ''
      const [salesRes, countsRes, attendanceRes, storesRes] = await Promise.all([
        get(`/pos/sales/today${storeParam}`),
        get(`/pos/stock-counts${storeParam}`),
        get(`/pos/attendance/status?_=${Date.now()}`),
        get('/pos/stores'),
      ])
      // Resolve store name from direct store lookup first (most reliable)
      if (storesRes?.success) {
        const stores = storesRes.data?.stores || []
        const match = storeId
          ? stores.find((s: any) => s.id === storeId)
          : stores[0]
        if (match?.name) {
          setStoreName(match.name)
          localStorage.setItem('staffStoreName', match.name)
        }
      }
      if (salesRes?.success) {
        const sales = salesRes.data?.sales || []
        setTodaySales(sales.slice(0, 5))
        setTodayTotal(salesRes.data?.total || 0)
      }
      if (attendanceRes?.success) {
        setClockedIn(attendanceRes.data?.clocked_in || false)
        setClockInTime(attendanceRes.data?.active_shift?.clock_in || null)
      }
      if (countsRes?.success) {
        const drafts = (countsRes.data?.stock_counts || []).filter((s: any) => s.status === 'draft')
        setPendingCounts(drafts.length)
      }
      setLoading(false)
    }
    init()
  }, [])

  // Fallback store name from localStorage (used while stores API loads)
  useEffect(() => {
    if (!storeName) {
      const stored = localStorage.getItem('staffStoreName') || staffData?.store_name || ''
      if (stored) setStoreName(stored)
    }
  }, [])

  const greeting = () => {
    const h = now.getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const staffName = user?.name || staffData?.name || 'Staff'

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const formatSaleTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })

  const paymentBadgeClass = (method: string) => {
    if (method === 'cash') return 'bg-green-100 text-green-700'
    if (method === 'card') return 'bg-blue-100 text-blue-700'
    if (method === 'gcash' || method === 'maya') return 'bg-purple-100 text-purple-700'
    return 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Header */}
      <div className="bg-[#E8302A] text-white px-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <Store className="h-3.5 w-3.5" />
            <span>{storeName || 'Loading...'}</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1 text-white/70 hover:text-white text-xs"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>

        <p className="text-white/80 text-sm">{greeting()},</p>
        <h1 className="text-2xl font-bold">{staffName}</h1>

        <div className="mt-3 flex items-center gap-2 text-white/70 text-xs">
          <Clock className="h-3 w-3" />
          <span>{formatDate(now)}</span>
          <span className="font-mono font-semibold text-white">{formatTime(now)}</span>
        </div>
      </div>

      <div className="flex-1 px-4 -mt-2 space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Today's Sales
            </div>
            {loading
              ? <div className="h-7 w-24 bg-gray-200 rounded animate-pulse mt-1" />
              : <p className="text-2xl font-bold text-gray-900">{formatCurrency(todayTotal)}</p>
            }
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <Receipt className="h-3.5 w-3.5" />
              Transactions
            </div>
            {loading
              ? <div className="h-7 w-12 bg-gray-200 rounded animate-pulse mt-1" />
              : <p className="text-2xl font-bold text-gray-900">{todaySales.length}</p>
            }
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Quick Actions</p>
          <Button
            onClick={() => navigate('/pos')}
            className="w-full h-14 bg-[#E8302A] hover:bg-[#B91C1C] text-white text-base font-semibold gap-3 rounded-xl shadow-sm"
          >
            <ShoppingCart className="h-5 w-5" />
            Start Checkout
          </Button>
          <button
            onClick={() => navigate('/pos/stock-count')}
            className="w-full flex items-center gap-3 bg-white border rounded-xl px-4 py-3.5 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-900 text-sm">Stock Count</p>
              <p className="text-xs text-gray-400">
                {pendingCounts > 0 ? `${pendingCounts} pending count${pendingCounts > 1 ? 's' : ''}` : 'No pending counts'}
              </p>
            </div>
            {pendingCounts > 0 && (
              <Badge className="bg-orange-100 text-orange-700 border-0 shrink-0">{pendingCounts}</Badge>
            )}
            <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
          </button>
          <button
            onClick={() => navigate('/pos/attendance')}
            className={`w-full flex items-center gap-3 border rounded-xl px-4 py-3.5 shadow-sm transition-colors ${
              clockedIn ? 'bg-green-50 border-green-200 hover:bg-green-100' : 'bg-white hover:bg-gray-50'
            }`}
          >
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${clockedIn ? 'bg-green-100' : 'bg-gray-100'}`}>
              {clockedIn
                ? <Timer className="h-5 w-5 text-green-600" />
                : <Fingerprint className="h-5 w-5 text-gray-500" />
              }
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-900 text-sm">Attendance</p>
              <p className={`text-xs ${clockedIn ? 'text-green-600' : 'text-gray-400'}`}>
                {clockedIn && clockInTime
                  ? `Clocked in since ${new Date(clockInTime).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}`
                  : 'Not clocked in today'}
              </p>
            </div>
            {clockedIn && <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />}
            <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recent Transactions</p>
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse" />
                      <div className="h-3 bg-gray-100 rounded w-1/4 animate-pulse" />
                    </div>
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : todaySales.length === 0 ? (
              <div className="py-10 text-center text-gray-400">
                <Receipt className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No transactions yet today</p>
              </div>
            ) : (
              todaySales.map((sale, i) => (
                <div key={sale.id} className={`flex items-center gap-3 px-4 py-3 ${i < todaySales.length - 1 ? 'border-b' : ''}`}>
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{sale.receipt_number}</p>
                    <p className="text-xs text-gray-400">{formatSaleTime(sale.created_at)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(sale.total_amount)}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${paymentBadgeClass(sale.payment_method)}`}>
                      {sale.payment_method?.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
