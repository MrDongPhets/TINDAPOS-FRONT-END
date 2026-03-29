import { useState, useEffect } from 'react'
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
import { Printer, FileText, Loader2, AlertCircle } from 'lucide-react'

export default function ZReadingPage() {
  const { get, post } = useApiClient()
  const [user, setUser] = useState<any>(null)
  const [stores, setStores] = useState<{ id: string; name: string }[]>([])
  const [selectedStore, setSelectedStore] = useState('')
  const [data, setData] = useState<any>(null)
  const [history, setHistory] = useState<{ id: string; reading_date: string; transaction_count: number; total_sales: number; vat_amount: number; or_from: string; or_to: string; closed_at: string | null }[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchZReading = async (storeId: string) => {
    setLoading(true)
    setError('')
    const [todayResult, historyResult] = await Promise.all([
      get(`/pos/sales/z-reading?store_id=${storeId}`),
      get(`/pos/sales/z-reading/history?store_id=${storeId}`)
    ])
    setLoading(false)
    if (todayResult?.success) {
      setData(todayResult.data)
    } else {
      setError(todayResult?.error || 'Failed to fetch Z-reading data')
    }
    if (historyResult?.success) {
      const records = historyResult.data?.z_readings || []
      setHistory(records)
      // Attach closed_at from today's saved record if it exists
      const today = new Date().toISOString().split('T')[0]
      const todayRecord = records.find((r: { reading_date: string }) => r.reading_date === today)
      if (todayRecord?.closed_at && todayResult?.success) {
        setData((prev: Record<string, unknown>) => ({ ...prev, closed_at: todayRecord.closed_at }))
      }
    }
  }

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selectedStore) fetchZReading(selectedStore)
  }, [selectedStore]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveZReading = async () => {
    setSaving(true)
    const result = await post('/pos/sales/z-reading', { store_id: selectedStore })
    setSaving(false)
    if (result?.success) {
      alert('Z-Reading saved successfully!')
      fetchZReading(selectedStore)
    } else {
      alert(result?.error || 'Failed to save Z-reading')
    }
  }

  const handlePrint = () => {
    if (!data) return
    const today = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
    const printHtml = `
      <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Z-Reading</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Courier New',monospace; font-size:12px; width:300px; margin:0 auto; padding:16px; }
        .center { text-align:center; } .divider { border-top:1px dashed #000; margin:8px 0; }
        .bold { font-weight:bold; } .row { display:flex; justify-content:space-between; padding:2px 0; }
        .large { font-size:14px; }
      </style></head><body>
        <div class="center">
          <div class="bold large">${data.store?.name || ''}</div>
          ${data.store?.address ? `<div>${data.store.address}</div>` : ''}
          ${data.company?.tax_id ? `<div>TIN: ${data.company.tax_id}</div>` : ''}
        </div>
        <div class="divider"></div>
        <div class="center bold">Z-READING REPORT</div>
        <div class="center">${today}</div>
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
        <div class="row bold"><span>GRAND TOTAL ACCUM.:</span><span>₱${(data.grand_total_accumulator || 0).toFixed(2)}</span></div>
        <div class="divider"></div>
        ${Object.entries(data.payment_breakdown || {}).map(([method, amount]: [string, any]) =>
          `<div class="row"><span>${method.replace('_',' ').toUpperCase()}:</span><span>₱${parseFloat(amount).toFixed(2)}</span></div>`
        ).join('')}
        <div class="divider"></div>
        <div class="center" style="font-size:11px">Generated: ${new Date().toLocaleString('en-PH')}</div>
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
                  <BreadcrumbPage>Z-Reading</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto pr-4"><UserMenuDropdown /></div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 pb-24">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 text-[#E8302A]" />
                Z-Reading
              </h1>
              <p className="text-sm text-gray-500 mt-1">BIR end-of-day sales summary</p>
            </div>
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Select store" />
              </SelectTrigger>
              <SelectContent>
                {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
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
                {/* Header */}
                <div className="text-center space-y-1">
                  <p className="font-bold text-lg">{data.store?.name}</p>
                  {data.store?.address && <p className="text-gray-500 text-xs">{data.store.address}</p>}
                  {data.company?.tax_id && <p className="text-gray-500 text-xs">TIN: {data.company.tax_id}</p>}
                  <p className="font-bold tracking-widest text-gray-700 mt-2">Z-READING REPORT</p>
                  <p className="text-gray-500 text-xs">{data.date}</p>
                </div>

                <Separator />

                <div className="space-y-1">
                  <div className="flex justify-between"><span className="text-gray-500">OR From:</span><span>{data.or_from || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">OR To:</span><span>{data.or_to || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Transactions:</span><span>{data.transaction_count}</span></div>
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

                <Separator />

                <div className="flex justify-between font-bold bg-gray-50 p-3 rounded-lg">
                  <span>GRAND TOTAL ACCUMULATOR:</span>
                  <span>{formatCurrency(data.grand_total_accumulator || 0)}</span>
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
                {data.closed_at && (
                  <p className="text-xs text-green-600 text-center font-medium">
                    ✓ Closed at: {new Date(data.closed_at).toLocaleString('en-PH')}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handlePrint} className="flex-1">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Z-Reading
                </Button>
                <Button onClick={handleSaveZReading} disabled={saving} className="flex-1 bg-[#E8302A] hover:bg-[#c0241f] text-white">
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                  {saving ? 'Saving...' : 'Close Day (Save Z-Reading)'}
                </Button>
              </div>

              {/* History */}
              {history.length > 0 && (
                <div className="bg-white border rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b bg-gray-50">
                    <p className="text-sm font-semibold text-gray-700">Past Z-Readings</p>
                    <p className="text-xs text-gray-400">One record per day — showing last {history.length}</p>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b">
                        <th className="text-left px-4 py-2">Date</th>
                        <th className="text-right px-4 py-2">Transactions</th>
                        <th className="text-right px-4 py-2">VAT</th>
                        <th className="text-right px-4 py-2">Total Sales</th>
                        <th className="text-right px-4 py-2">OR Range</th>
                        <th className="text-right px-4 py-2">Closed At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((row) => (
                        <tr key={row.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium">{row.reading_date}</td>
                          <td className="px-4 py-2 text-right text-gray-600">{row.transaction_count}</td>
                          <td className="px-4 py-2 text-right text-gray-600">{formatCurrency(row.vat_amount || 0)}</td>
                          <td className="px-4 py-2 text-right font-semibold">{formatCurrency(row.total_sales || 0)}</td>
                          <td className="px-4 py-2 text-right text-xs text-gray-400 font-mono">
                            {row.or_from && row.or_to ? `${row.or_from} → ${row.or_to}` : 'N/A'}
                          </td>
                          <td className="px-4 py-2 text-right text-xs text-green-600">
                            {row.closed_at ? new Date(row.closed_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : <span className="text-gray-300">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
