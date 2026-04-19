import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/ui/app-sidebar'
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { UserMenuDropdown } from '@/components/ui/UserMenuDropdown'
import { useApiClient } from '@/hooks/useApiClient'
import { ClipboardList, Plus, Loader2, AlertCircle, ChevronRight, ShieldAlert } from 'lucide-react'

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

const STATUS_CONFIG = {
  draft:     { label: 'Draft',      bg: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400' },
  submitted: { label: 'For Review', bg: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500' },
  approved:  { label: 'Approved',   bg: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
}

export default function StockCountPage() {
  const { get, post } = useApiClient()
  const navigate = useNavigate()
  const [stores, setStores] = useState<{ id: string; name: string }[]>([])
  const [selectedStore, setSelectedStore] = useState('')
  const [stockCounts, setStockCounts] = useState<StockCount[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      const result = await get('/client/stores')
      if (result?.success) {
        const list = result.data?.stores || []
        setStores(list)
        if (list.length > 0) setSelectedStore(list[0].id)
      }
    }
    init() // eslint-disable-line react-hooks/exhaustive-deps
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedStore) return
    const fetch = async () => {
      setLoading(true)
      setError('')
      const result = await get(`/client/stock-counts?store_id=${selectedStore}`)
      setLoading(false)
      if (result?.success) {
        setStockCounts(result.data?.stock_counts || [])
      } else {
        setError(result?.error || 'Failed to load stock counts')
      }
    }
    fetch() // eslint-disable-line react-hooks/exhaustive-deps
  }, [selectedStore]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    if (!selectedStore) return
    setCreating(true)
    const result = await post('/client/stock-counts', { store_id: selectedStore })
    setCreating(false)
    if (result?.success) {
      navigate(`/client/inventory/stock-count/${result.data.stock_count.id}`)
    } else {
      setError(result?.error || 'Failed to create stock count')
    }
  }

  const draftCount = stockCounts.filter(sc => sc.status === 'draft').length
  const pendingReview = stockCounts.filter(sc => sc.status === 'submitted').length
  const approvedCount = stockCounts.filter(sc => sc.status === 'approved').length

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/client/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/client/inventory/products">Inventory</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem><BreadcrumbPage>Stock Count</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto"><UserMenuDropdown /></div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-4 pb-24">
          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ClipboardList className="h-6 w-6" /> Stock Count
              </h1>
              <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">
                Physical inventory audit to detect variance and prevent theft
              </p>
            </div>
            {pendingReview > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-2 rounded-lg self-start sm:self-auto shrink-0">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span><strong>{pendingReview}</strong> count{pendingReview > 1 ? 's' : ''} waiting for review</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-800">{draftCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">Draft</p>
            </div>
            <div className={`border rounded-xl p-4 text-center ${pendingReview > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white'}`}>
              <p className={`text-2xl font-bold ${pendingReview > 0 ? 'text-amber-600' : 'text-gray-800'}`}>{pendingReview}</p>
              <p className="text-xs text-gray-500 mt-0.5">For Review</p>
            </div>
            <div className="bg-white border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">Approved</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Select store" />
              </SelectTrigger>
              <SelectContent>
                {stores.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleCreate} disabled={creating || !selectedStore} className="gap-2 sm:w-auto w-full">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              New Stock Count
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : stockCounts.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <ClipboardList className="h-14 w-14 mx-auto mb-4 opacity-20" />
              <p className="font-semibold text-gray-500">No stock counts yet</p>
              <p className="text-sm mt-1">Create a new stock count and assign it to your staff</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stockCounts.map(sc => {
                const cfg = STATUS_CONFIG[sc.status]
                const isSubmitted = sc.status === 'submitted'
                return (
                  <div
                    key={sc.id}
                    onClick={() => navigate(`/client/inventory/stock-count/${sc.id}`)}
                    className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-sm bg-white group ${
                      isSubmitted ? 'border-amber-300 hover:border-amber-400' : 'hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-2 w-2 rounded-full shrink-0 ${cfg.dot}`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 truncate">{sc.stores?.name}</span>
                            <Badge className={`${cfg.bg} border-0 text-xs shrink-0`}>{cfg.label}</Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5 truncate">
                            By {sc.users?.name} · {new Date(sc.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {sc.submitted_at && (
                            <p className="text-xs text-amber-600 mt-0.5">
                              Submitted {new Date(sc.submitted_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                          {sc.approved_at && (
                            <p className="text-xs text-green-600 mt-0.5">
                              Approved {new Date(sc.approved_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
