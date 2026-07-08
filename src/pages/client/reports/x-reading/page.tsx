import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
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
import { formatCurrency } from '@/lib/utils'
import { Printer, Activity, Loader2, AlertCircle } from 'lucide-react'

export default function XReadingPage() {
  const { get } = useApiClient()
  const [user, setUser] = useState<any>(null)
  const [stores, setStores] = useState<{ id: string; name: string }[]>([])
  const [selectedStore, setSelectedStore] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchXReading = useCallback(async (storeId: string) => {
    setLoading(true)
    setError('')
    const result = await get(`/pos/sales/x-reading?store_id=${storeId}`)
    setLoading(false)
    if (result?.success) {
      setData(result.data)
    } else {
      setError(result?.error || 'Failed to fetch X-reading data')
    }
  }, [get])

  useEffect(() => {
    const init = async () => {
      const stored = localStorage.getItem('user')
      if (stored) setUser(JSON.parse(stored))
      const result = await get('/client/dashboard/stores')
      if (result?.data?.stores?.length) {
        setStores(result.data.stores)
        setSelectedStore(result.data.stores[0].id)
      }
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedStore) fetchXReading(selectedStore)
  }, [selectedStore]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePrint = () => {
    if (!data) return
    const today = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
    const asOf = new Date(data.as_of).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const printHtml = `
      <!DOCTYPE html><html><head><meta charset="UTF-8"><title>X-Reading</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Courier New',monospace; font-size:12px; width:300px; margin:0 auto; padding:16px; }
        .center { text-align:center; } .divider { border-top:1px dashed #000; margin:8px 0; }
        .bold { font-weight:bold; } .row { display:flex; justify-content:space-between; padding:2px 0; }
        .large { font-size:14px; } .small { font-size:10px; } .gray { color:#666; }
      </style></head><body>
        <div class="center">
          <div class="bold large">${data.store?.name || ''}</div>
          ${data.store?.address ? `<div class="gray">${data.store.address}</div>` : ''}
          ${data.company?.tax_id ? `<div class="gray">TIN: ${data.company.tax_id}</div>` : ''}
        </div>
        <div class="divider"></div>
        <div class="center bold">X-READING REPORT</div>
        <div class="center">${today}</div>
        <div class="center small gray">As of: ${asOf}</div>
        <div class="center small gray">(Not an official BIR document)</div>
        <div class="divider"></div>
        <div class="row"><span>OR From:</span><span>${data.or_from || 'N/A'}</span></div>
        <div class="row"><span>OR To:</span><span>${data.or_to || 'N/A'}</span></div>
        <div class="row"><span>Transactions:</span><span>${data.transaction_count}</span></div>
        <div class="divider"></div>
        <div class="row"><span>VATable Sales (ex-VAT):</span><span>₱${((data.vatable_sales || 0) / 1.12).toFixed(2)}</span></div>
        <div class="row"><span>VAT-Exempt Sales:</span><span>₱${(data.vat_exempt_sales || 0).toFixed(2)}</span></div>
        <div class="row"><span>Zero-Rated Sales:</span><span>₱${(data.zero_rated_sales || 0).toFixed(2)}</span></div>
        <div class="row bold"><span>VAT Amount (12%):</span><span>₱${(data.vat_amount || 0).toFixed(2)}</span></div>
        <div class="divider"></div>
        <div class="row bold large"><span>TOTAL SALES:</span><span>₱${(data.total_sales || 0).toFixed(2)}</span></div>
        <div class="divider"></div>
        ${Object.entries(data.payment_breakdown || {}).map(([method, amount]: [string, any]) =>
          `<div class="row"><span>${method.replace('_',' ').toUpperCase()}:</span><span>₱${parseFloat(amount).toFixed(2)}</span></div>`
        ).join('')}
        <div class="divider"></div>
        <div class="center small gray">Generated: ${new Date().toLocaleString('en-PH')}</div>
      </body></html>
    `
    const w = window.open('', '_blank', 'width=400,height=700')
    if (w) { w.document.write(printHtml); w.document.close(); w.focus(); w.print(); w.close() }
  }

  return (
    <SidebarProvider>
      <AppSidebar userType="client" user={user} />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 overflow-hidden">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/client">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/client/reports">Reports</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>X-Reading</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto pr-4"><UserMenuDropdown /></div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 pb-24">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 text-[#E8302A]" />
              X-Reading
            </h1>
            <p className="text-sm text-gray-500 mt-1">Current shift running total</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 font-medium">Store:</span>
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Select store" />
              </SelectTrigger>
              <SelectContent>
                {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <Activity className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-700">
              X-Reading shows your running totals for today without closing the day. Use <strong>Z-Reading</strong> at end of day to officially record and close.
            </p>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {data && !loading && (
            <div className="max-w-2xl mx-auto w-full space-y-4">
              <div className="bg-white border rounded-xl p-6 space-y-4 font-mono text-sm">
                {/* Store header */}
                <div className="text-center space-y-1">
                  <p className="font-bold text-lg">{data.store?.name}</p>
                  {data.store?.address && <p className="text-gray-500 text-xs">{data.store.address}</p>}
                  {data.company?.tax_id && <p className="text-gray-500 text-xs">TIN: {data.company.tax_id}</p>}
                  <p className="font-bold tracking-widest text-gray-700 mt-2">X-READING REPORT</p>
                  <p className="text-gray-500 text-xs">{data.date}</p>
                  <p className="text-gray-400 text-xs">
                    As of: {new Date(data.as_of).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                  <span className="inline-block text-xs bg-yellow-100 text-yellow-700 border border-yellow-300 rounded px-2 py-0.5 mt-1">
                    Not an official BIR document
                  </span>
                </div>

                <Separator />

                <div className="space-y-1">
                  <div className="flex justify-between"><span className="text-gray-500">OR From:</span><span>{data.or_from || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">OR To:</span><span>{data.or_to || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Transactions:</span><span>{data.transaction_count}</span></div>
                  {data.shift_start && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Shift Started:</span>
                      <span>{new Date(data.shift_start).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">VAT Breakdown</p>
                  <div className="flex justify-between"><span className="text-gray-500">VATable Sales (ex-VAT):</span><span>{formatCurrency((data.vatable_sales || 0) / 1.12)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">VAT-Exempt Sales:</span><span>{formatCurrency(data.vat_exempt_sales || 0)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Zero-Rated Sales:</span><span>{formatCurrency(data.zero_rated_sales || 0)}</span></div>
                  <div className="flex justify-between font-semibold"><span>VAT Amount (12%):</span><span>{formatCurrency(data.vat_amount || 0)}</span></div>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>TOTAL SALES:</span>
                  <span>{formatCurrency(data.total_sales || 0)}</span>
                </div>

                {Object.keys(data.payment_breakdown || {}).length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Payment Breakdown</p>
                      {Object.entries(data.payment_breakdown || {}).map(([method, amount]: [string, any]) => (
                        <div key={method} className="flex justify-between">
                          <span className="text-gray-500 capitalize">{method.replace('_', ' ')}:</span>
                          <span>{formatCurrency(parseFloat(amount))}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <Separator />
                <p className="text-xs text-gray-400 text-center">Generated: {new Date().toLocaleString('en-PH')}</p>
              </div>

              <Button variant="outline" onClick={handlePrint} className="w-full">
                <Printer className="h-4 w-4 mr-2" />
                Print X-Reading
              </Button>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
