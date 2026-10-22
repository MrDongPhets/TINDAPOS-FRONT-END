// Settings → BIR & Invoicing → E-invoice status (Invoicing plan P2-8)
// Counts per status, the e-invoices that need the owner (refused, connection problem, gave up, rejected by BIR),
// and a Retry button (same Idempotency-Key on the server, so a retry can never issue twice).
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApiClient } from '@/hooks/useApiClient'
import API_CONFIG from '@/config/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, RefreshCw, FileCheck2 } from 'lucide-react'
import { canRetry, EINVOICE_KIND, EINVOICE_STATUS, type EinvoiceFilter, type EinvoiceList } from '@/lib/einvoices'

const { EINVOICES } = API_CONFIG.ENDPOINTS.BIR
const FILTERS: Array<{ value: EinvoiceFilter; label: string }> = [
  { value: 'attention', label: 'Needs attention' },
  { value: 'pending', label: 'Pending' },
  { value: 'all', label: 'All' },
]

export function EinvoiceStatusCard() {
  const { get, post } = useApiClient()
  const [filter, setFilter] = useState<EinvoiceFilter>('attention')
  const [list, setList] = useState<EinvoiceList | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  // Bump to reload the list (after a retry). `loading` is switched on by whoever changes the filter.
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let alive = true
    get(`${EINVOICES}?filter=${filter}&limit=50`).then(res => {
      if (!alive) return
      setLoading(false)
      if (res?.success) setList(res.data)
      else setMessage({ ok: false, text: res?.error || 'Could not load e-invoices' })
    })
    return () => { alive = false }
  }, [get, filter, reload])

  const retry = async (id: string) => {
    setBusyId(id); setMessage(null)
    const res = await post(`${EINVOICES}/${id}/retry`, {})
    setBusyId(null)
    if (res?.success) {
      const e = res.data.einvoice
      setMessage({ ok: e?.status === 'issued', text: e?.status === 'issued' ? `Issued${e.invoice_no ? `: ${e.invoice_no}` : ''}` : e?.message || 'Sent again — still not issued' })
    } else setMessage({ ok: false, text: res?.error || 'Retry failed' })
    setReload(n => n + 1)
  }

  const c = list?.counts || {}
  const issued = (c.issued || 0) + (c.accepted || 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck2 className="h-5 w-5 text-[#E8302A]" /> E-invoice status
        </CardTitle>
        <CardDescription>Every e-invoice sale, credit memo and cancellation sent to TaxTrail.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold text-green-700">{issued}</p>
            <p className="text-xs text-green-800">Issued{c.accepted ? ` (${c.accepted} BIR ok)` : ''}</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-2">
            <p className="text-lg font-bold text-amber-700">{list?.pending ?? 0}</p>
            <p className="text-xs text-amber-800">Pending</p>
          </div>
          <div className={`rounded-lg p-2 ${list?.attention ? 'bg-red-50' : 'bg-gray-50'}`}>
            <p className={`text-lg font-bold ${list?.attention ? 'text-red-700' : 'text-gray-500'}`}>{list?.attention ?? 0}</p>
            <p className={`text-xs ${list?.attention ? 'text-red-800' : 'text-gray-500'}`}>Need attention</p>
          </div>
        </div>

        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {FILTERS.map(f => (
            <button key={f.value} type="button" onClick={() => { if (f.value !== filter) { setLoading(true); setFilter(f.value) } }}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium ${filter === f.value ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {message && <Alert variant={message.ok ? 'default' : 'destructive'}><AlertDescription>{message.text}</AlertDescription></Alert>}

        {loading ? (
          <div className="flex justify-center py-6 text-gray-500"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : !list?.items.length ? (
          <p className="py-4 text-center text-sm text-gray-500">{filter === 'attention' ? 'Nothing needs attention 👍' : 'No e-invoices here yet.'}</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {list.items.map(i => {
              const st = EINVOICE_STATUS[i.status] || { label: i.status, className: 'bg-gray-100 text-gray-700' }
              return (
                <li key={i.id} className="p-3 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {EINVOICE_KIND[i.kind] || i.kind}
                        {i.esp_invoice_no && <span className="font-mono"> {i.esp_invoice_no}</span>}
                      </p>
                      <p className="text-xs text-gray-500">
                        <Link to={`/client/sales/${i.sale_id}`} className="underline">{i.or_number || 'Sale'}</Link>
                        {i.adjustment_no && <> · {i.adjustment_no}</>}
                        {' · '}{new Date(i.created_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Manila' })}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.className}`}>{st.label}</span>
                  </div>
                  {(i.message || i.last_error) && i.status !== 'issued' && i.status !== 'accepted' && (
                    <p className="text-xs text-gray-600">{i.message}{i.last_error ? <span className="block text-gray-400 break-words">{i.last_error}</span> : null}</p>
                  )}
                  {canRetry(i.status) && (
                    <Button size="sm" variant="outline" disabled={!!busyId} onClick={() => retry(i.id)}>
                      {busyId === i.id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
                      Retry now
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
