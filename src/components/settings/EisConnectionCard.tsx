// Settings → BIR & Invoicing → E-invoicing: connection to the e-invoicing service provider (ITBS TaxTrail).
// The API key goes to the server once, is stored encrypted, and is never shown again (only ••••last4).
import { useState } from 'react'
import { useApiClient } from '@/hooks/useApiClient'
import API_CONFIG from '@/config/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Loader2, PlugZap, XCircle } from 'lucide-react'
import { eisReady, type EisConnectionView } from '@/lib/eisConnection'

const { EIS, EIS_TEST } = API_CONFIG.ENDPOINTS.BIR

export function EisConnectionCard({ value, onChange }: { value: EisConnectionView | null; onChange: (v: EisConnectionView) => void }) {
  const { put, post, delete: del } = useApiClient()
  const [baseUrl, setBaseUrl] = useState(value?.base_url || '')
  const [apiKey, setApiKey] = useState('')
  const [busy, setBusy] = useState<'save' | 'test' | 'remove' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    setBusy('save'); setError(null)
    const res = await put(EIS, { base_url: baseUrl, ...(apiKey.trim() ? { api_key: apiKey.trim() } : {}) })
    setBusy(null)
    if (res?.success) { onChange(res.data); setApiKey(''); setBaseUrl(res.data.base_url || baseUrl) }
    else setError(res?.error || 'Could not save the connection')
  }

  const test = async () => {
    setBusy('test'); setError(null)
    const res = await post(EIS_TEST, {})
    setBusy(null)
    if (res?.success) onChange(res.data)
    else setError(res?.error || 'Could not test the connection')
  }

  const remove = async () => {
    if (!confirm('Disconnect TaxTrail? Every store goes back to manual invoices.')) return
    setBusy('remove'); setError(null)
    const res = await del(EIS)
    setBusy(null)
    if (res?.success) { onChange(res.data); setBaseUrl(''); setApiKey('') }
    else setError(res?.error || 'Could not disconnect')
  }

  const connected = !!value?.connected
  const ok = eisReady(value)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlugZap className="h-5 w-5 text-[#E8302A]" /> E-invoicing (TaxTrail)
        </CardTitle>
        <CardDescription>
          For stores that must send invoices to BIR. TaxTrail (by ITBS) issues each e-invoice and sends it to BIR; Tindapo sends it the sale.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {value && value.encryption_ready === false && (
          <Alert variant="destructive"><AlertDescription>E-invoicing isn't set up on this server yet. Contact Tindapo support.</AlertDescription></Alert>
        )}

        {connected && (
          <div className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${ok ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'}`}>
            {ok ? <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" /> : <XCircle className="h-4 w-4 mt-0.5 shrink-0" />}
            <div>
              <p>{value?.last_check_message || (ok ? 'Connected' : 'Not tested yet')}</p>
              {value?.last_checked_at && <p className="text-xs opacity-75">Checked {new Date(value.last_checked_at).toLocaleString('en-PH')}</p>}
              {ok && value?.status_updates && (
                <p className="text-xs opacity-75">BIR status updates: {value.status_updates === 'webhook' ? 'instant' : 'checked every few minutes'}</p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="eis-url">TaxTrail address</Label>
          <Input id="eis-url" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="https://taxtrail.example.com" inputMode="url" autoComplete="off" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="eis-key">API key</Label>
          <Input
            id="eis-key"
            type="password"
            autoComplete="new-password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder={connected ? `Saved (${value?.api_key_hint}) — leave empty to keep it` : 'sk_test_… or sk_live_…'}
          />
          <p className="text-xs text-gray-500">From TaxTrail → Apps &amp; Sandbox. It's stored encrypted and never shown again.</p>
        </div>

        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={save} disabled={!!busy || !baseUrl.trim() || (!connected && !apiKey.trim())} className="flex-1">
            {busy === 'save' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : connected ? 'Save & test' : 'Connect'}
          </Button>
          {connected && (
            <>
              <Button variant="outline" onClick={test} disabled={!!busy} className="flex-1">
                {busy === 'test' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Testing…</> : 'Test again'}
              </Button>
              <Button variant="ghost" onClick={remove} disabled={!!busy} className="text-red-600 hover:bg-red-50">
                {busy === 'remove' ? 'Removing…' : 'Disconnect'}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
