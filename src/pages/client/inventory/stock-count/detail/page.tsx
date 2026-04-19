import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/ui/app-sidebar'
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { UserMenuDropdown } from '@/components/ui/UserMenuDropdown'
import { useApiClient } from '@/hooks/useApiClient'
import {
  ClipboardList, Loader2, AlertCircle, CheckCircle,
  Clock, TrendingDown, TrendingUp, Package, ShieldCheck
} from 'lucide-react'

type CountItem = {
  id: string
  product_id: string
  expected_qty: number | null
  actual_qty: number | null
  variance: number | null
  notes: string | null
  products: { id: string; name: string; sku: string; stock_quantity: number }
}

type StockCount = {
  id: string
  status: 'draft' | 'submitted' | 'approved'
  notes: string | null
  created_at: string
  submitted_at: string | null
  approved_at: string | null
  stores: { name: string }
  users: { name: string }
}

export default function StockCountDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { get, post } = useApiClient()

  const [stockCount, setStockCount] = useState<StockCount | null>(null)
  const [items, setItems] = useState<CountItem[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const result = await get(`/client/stock-counts/${id}`)
      setLoading(false)
      if (result?.success) {
        setStockCount(result.data.stock_count)
        setItems(result.data.items || [])
      } else {
        setError(result?.error || 'Failed to load stock count')
      }
    }
    if (id) init() // eslint-disable-line react-hooks/exhaustive-deps
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleApprove = async () => {
    setApproving(true)
    const result = await post(`/client/stock-counts/${id}/approve`, {})
    setApproving(false)
    if (result?.success) {
      setStockCount(prev => prev ? { ...prev, status: 'approved', approved_at: new Date().toISOString() } : prev)
      setSuccess('Stock count approved and locked!')
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError(result?.error || 'Failed to approve')
    }
  }

  const isDraft = stockCount?.status === 'draft'
  const isSubmitted = stockCount?.status === 'submitted'
  const isApproved = stockCount?.status === 'approved'
  const showVariance = isSubmitted || isApproved

  const totalVariance = items.reduce((sum, item) => sum + (item.variance || 0), 0)
  const missingItems = items.filter(item => (item.variance || 0) < 0)
  const overItems = items.filter(item => (item.variance || 0) > 0)

  const statusConfig = {
    draft:     { label: 'Draft',      className: 'bg-gray-100 text-gray-600 border-0' },
    submitted: { label: 'For Review', className: 'bg-amber-100 text-amber-700 border-0' },
    approved:  { label: 'Approved',   className: 'bg-green-100 text-green-700 border-0' },
  }

  if (loading) return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block"><BreadcrumbLink href="/client/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block"><BreadcrumbLink href="/client/inventory/stock-count">Stock Count</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem><BreadcrumbPage>Detail</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto"><UserMenuDropdown /></div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-4 pb-24">
          {/* Page Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <ClipboardList className="h-6 w-6 text-gray-500" />
                  {stockCount?.stores?.name}
                </h1>
                {stockCount && (
                  <Badge className={statusConfig[stockCount.status].className}>
                    {isApproved && <CheckCircle className="h-3 w-3 mr-1" />}
                    {isSubmitted && <Clock className="h-3 w-3 mr-1" />}
                    {statusConfig[stockCount.status].label}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Created by <span className="font-medium text-gray-700">{stockCount?.users?.name}</span>
                {' · '}
                {stockCount && new Date(stockCount.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              {stockCount?.submitted_at && (
                <p className="text-xs text-amber-600 mt-0.5">
                  Submitted: {new Date(stockCount.submitted_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
              {stockCount?.approved_at && (
                <p className="text-xs text-green-600 mt-0.5">
                  Approved: {new Date(stockCount.approved_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 border border-green-100 p-3 rounded-lg">
              <CheckCircle className="h-4 w-4 shrink-0" /> {success}
            </div>
          )}

          {/* Draft — waiting banner */}
          {isDraft && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800">Waiting for staff to complete the count</p>
                <p className="text-sm text-amber-700 mt-0.5">
                  Staff will enter actual quantities through their POS interface. Once submitted, you can review the variance and approve.
                </p>
              </div>
            </div>
          )}

          {/* Summary Cards — after submission */}
          {showVariance && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border rounded-xl p-4 text-center">
                <Package className="h-5 w-5 mx-auto mb-1 text-gray-400" />
                <p className="text-2xl font-bold text-gray-800">{items.length}</p>
                <p className="text-xs text-gray-500 mt-0.5">Products</p>
              </div>
              <div className={`border rounded-xl p-4 text-center ${missingItems.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
                <TrendingDown className={`h-5 w-5 mx-auto mb-1 ${missingItems.length > 0 ? 'text-red-400' : 'text-gray-300'}`} />
                <p className={`text-2xl font-bold ${missingItems.length > 0 ? 'text-red-600' : 'text-gray-400'}`}>{missingItems.length}</p>
                <p className="text-xs text-gray-500 mt-0.5">Missing</p>
              </div>
              <div className={`border rounded-xl p-4 text-center ${overItems.length > 0 ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
                <TrendingUp className={`h-5 w-5 mx-auto mb-1 ${overItems.length > 0 ? 'text-blue-400' : 'text-gray-300'}`} />
                <p className={`text-2xl font-bold ${overItems.length > 0 ? 'text-blue-600' : 'text-gray-400'}`}>{overItems.length}</p>
                <p className="text-xs text-gray-500 mt-0.5">Over</p>
              </div>
              <div className={`border rounded-xl p-4 text-center ${totalVariance < 0 ? 'bg-red-50 border-red-200' : totalVariance > 0 ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
                <ShieldCheck className={`h-5 w-5 mx-auto mb-1 ${totalVariance < 0 ? 'text-red-400' : totalVariance > 0 ? 'text-blue-400' : 'text-green-400'}`} />
                <p className={`text-2xl font-bold ${totalVariance < 0 ? 'text-red-600' : totalVariance > 0 ? 'text-blue-600' : 'text-green-600'}`}>
                  {totalVariance > 0 ? '+' : ''}{totalVariance}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Net Variance</p>
              </div>
            </div>
          )}

          {/* Table + Sticky Missing Stock — side by side on large screens */}
          <div className="flex gap-4 items-start">
            {/* Items Table */}
            <div className="bg-white border rounded-xl overflow-hidden flex-1 min-w-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Product</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">SKU</th>
                    {showVariance ? (
                      <>
                        <th className="text-center px-4 py-3 font-semibold text-gray-600">Expected</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-600">Actual</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-600">Variance</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Notes</th>
                      </>
                    ) : (
                      <th className="text-center px-4 py-3 font-semibold text-gray-400">Status</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map(item => {
                    const variance = item.variance
                    const isMissing = (variance || 0) < 0
                    const isOver = (variance || 0) > 0
                    return (
                      <tr
                        key={item.id}
                        className={isMissing ? 'bg-red-50/60' : isOver ? 'bg-blue-50/40' : 'bg-white'}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">{item.products?.name}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">{item.products?.sku || '—'}</td>
                        {showVariance ? (
                          <>
                            <td className="px-4 py-3 text-center text-gray-600">{item.expected_qty ?? '—'}</td>
                            <td className="px-4 py-3 text-center font-semibold text-gray-800">{item.actual_qty ?? '—'}</td>
                            <td className="px-4 py-3 text-center">
                              {variance != null ? (
                                <span className={`inline-flex items-center gap-0.5 font-bold text-sm ${
                                  isMissing ? 'text-red-600' : isOver ? 'text-blue-600' : 'text-gray-400'
                                }`}>
                                  {isMissing && <TrendingDown className="h-3.5 w-3.5" />}
                                  {isOver && <TrendingUp className="h-3.5 w-3.5" />}
                                  {variance > 0 ? '+' : ''}{variance}
                                </span>
                              ) : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{item.notes || '—'}</td>
                          </>
                        ) : (
                          <td className="px-4 py-3 text-center">
                            <span className="text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">Pending count</span>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Sticky Missing Stock Panel */}
            {showVariance && missingItems.length > 0 && (
              <div className="hidden lg:block w-72 shrink-0 sticky top-4">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {missingItems.length} missing
                  </p>
                  <div className="space-y-2">
                    {missingItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-white border border-red-100 rounded-lg px-3 py-2">
                        <span className="text-sm font-medium text-gray-800 truncate pr-2">{item.products?.name}</span>
                        <span className="text-sm font-bold text-red-600 shrink-0">{item.variance}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Missing stock — mobile only (below table) */}
          {showVariance && missingItems.length > 0 && (
            <div className="lg:hidden bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {missingItems.length} product{missingItems.length > 1 ? 's' : ''} with missing stock
              </p>
              <div className="space-y-2">
                {missingItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-white border border-red-100 rounded-lg px-3 py-2">
                    <span className="text-sm font-medium text-gray-800">{item.products?.name}</span>
                    <span className="text-sm font-bold text-red-600">{item.variance} units</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => navigate('/client/inventory/stock-count')}>
              Back to List
            </Button>
            {isSubmitted && (
              <Button onClick={handleApprove} disabled={approving} className="gap-2 bg-green-600 hover:bg-green-700 text-white px-6">
                {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Approve & Lock
              </Button>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
