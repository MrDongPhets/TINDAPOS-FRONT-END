// Settings → BIR & Invoicing: company BIR registration (TIN, VAT status, registered name/address)
// and per-store branch code + POS registration (PTU / MIN / MSN). Owner only.
import { useEffect, useState } from 'react'
import { useApiClient } from '@/hooks/useApiClient'
import API_CONFIG from '@/config/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle, FileText, Loader2, Store } from 'lucide-react'

const { SETTINGS: BIR_SETTINGS } = API_CONFIG.ENDPOINTS.BIR

type VatStatus = 'vat' | 'non_vat' | 'rbe'

interface BirCompany {
  name: string
  address: string | null
  tin: string | null
  vat_status: VatStatus
  bir_registered_name: string | null
  bir_trade_name: string | null
  bir_registered_address: string | null
}

interface BirStore {
  id: string
  name: string
  is_active: boolean
  branch_code: string
  invoicing_mode: 'manual' | 'eis'
  ptu_number: string | null
  min_number: string | null
  msn_number: string | null
}

const VAT_OPTIONS: { value: VatStatus; label: string; hint: string }[] = [
  { value: 'non_vat', label: 'Non-VAT', hint: 'Most sari-sari stores (yearly sales of ₱3 million or less). Invoices show no VAT.' },
  { value: 'vat', label: 'VAT-registered', hint: 'Your COR (BIR Form 2303) says VAT. Invoices show VATable sales and 12% VAT.' },
  { value: 'rbe', label: 'Registered Business Enterprise', hint: 'Registered with an investment promotion agency (e.g. PEZA).' },
]

// "123456789" → "123-456-789" for display
const formatTin = (tin: string | null) => (tin && /^\d{9}$/.test(tin) ? `${tin.slice(0, 3)}-${tin.slice(3, 6)}-${tin.slice(6)}` : tin || '')

export function BirSettingsCard() {
  const { get, put } = useApiClient()
  const [company, setCompany] = useState<BirCompany | null>(null)
  const [tinInput, setTinInput] = useState('')
  const [stores, setStores] = useState<BirStore[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    get(BIR_SETTINGS).then(res => {
      if (res?.success && res.data?.company) {
        setCompany(res.data.company)
        setTinInput(formatTin(res.data.company.tin))
        setStores(res.data.stores || [])
      } else {
        setMsg({ type: 'error', text: res?.error || 'Could not load BIR settings' })
      }
      setLoading(false)
    })
  }, [get])

  const updateCompany = (patch: Partial<BirCompany>) => setCompany(c => (c ? { ...c, ...patch } : c))
  const updateStore = (id: string, patch: Partial<BirStore>) => setStores(list => list.map(s => (s.id === id ? { ...s, ...patch } : s)))

  const save = async () => {
    if (!company) return
    setSaving(true)
    setMsg(null)
    const res = await put(BIR_SETTINGS, {
      company: {
        bir_registered_name: company.bir_registered_name,
        bir_trade_name: company.bir_trade_name,
        bir_registered_address: company.bir_registered_address,
        tin: tinInput,
        vat_status: company.vat_status,
      },
      stores: stores.map(s => ({
        id: s.id, branch_code: s.branch_code, ptu_number: s.ptu_number, min_number: s.min_number, msn_number: s.msn_number,
      })),
    })
    setSaving(false)
    if (res?.success) {
      setCompany(res.data.company)
      setTinInput(formatTin(res.data.company.tin))
      setStores(res.data.stores || [])
      // Invoices read company details from here
      try {
        const stored = JSON.parse(localStorage.getItem('companyData') || '{}')
        const { tin, vat_status, bir_registered_name, bir_trade_name, bir_registered_address } = res.data.company
        localStorage.setItem('companyData', JSON.stringify({ ...stored, tin, vat_status, bir_registered_name, bir_trade_name, bir_registered_address }))
      } catch { /* storage unavailable — invoices will refresh on next login */ }
      setMsg({ type: 'success', text: 'BIR settings saved' })
    } else {
      setMsg({ type: 'error', text: res?.error || 'Failed to save BIR settings' })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading BIR settings…
        </CardContent>
      </Card>
    )
  }

  if (!company) {
    return msg ? <Alert variant="destructive"><AlertDescription>{msg.text}</AlertDescription></Alert> : null
  }

  const vatHint = VAT_OPTIONS.find(o => o.value === company.vat_status)?.hint

  return (
    <div className="space-y-4">
      {/* Company = the taxpayer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#E8302A]" /> BIR Registration
          </CardTitle>
          <CardDescription>Copy these from your Certificate of Registration (BIR Form 2303). They appear on your invoices.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bir-tin">TIN</Label>
            <Input id="bir-tin" inputMode="numeric" value={tinInput} onChange={e => setTinInput(e.target.value)} placeholder="123-456-789" />
            <p className="text-xs text-gray-500">9 digits only. The branch code (e.g. 00000) is set per store below.</p>
          </div>

          <div className="space-y-2">
            <Label>VAT status</Label>
            <Select value={company.vat_status} onValueChange={v => updateCompany({ vat_status: v as VatStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {VAT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {vatHint && <p className="text-xs text-gray-500">{vatHint}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bir-regnm">Registered name</Label>
            <Input id="bir-regnm" value={company.bir_registered_name || ''} onChange={e => updateCompany({ bir_registered_name: e.target.value })} placeholder={company.name} maxLength={200} />
            <p className="text-xs text-gray-500">The owner's or company's name as registered with BIR.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bir-trade">Business / trade name <span className="text-gray-400 font-normal">(optional)</span></Label>
            <Input id="bir-trade" value={company.bir_trade_name || ''} onChange={e => updateCompany({ bir_trade_name: e.target.value })} placeholder="e.g. Aling Nena Sari-Sari Store" maxLength={200} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bir-addr">Registered address</Label>
            <Textarea id="bir-addr" rows={2} value={company.bir_registered_address || ''} onChange={e => updateCompany({ bir_registered_address: e.target.value })} placeholder={company.address || 'Street, Barangay, City, Province'} maxLength={300} />
          </div>
        </CardContent>
      </Card>

      {/* Store = branch / POS terminal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-[#E8302A]" /> Stores
          </CardTitle>
          <CardDescription>Branch code for each store. PTU, MIN and serial number only if that store's POS is registered with BIR.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stores.length === 0 && <p className="text-sm text-gray-500">No stores yet.</p>}
          {stores.map(s => (
            <div key={s.id} className="rounded-xl border p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {s.name}
                  {!s.is_active && <span className="ml-2 text-xs text-gray-400">(inactive)</span>}
                </p>
                <Badge variant="outline" className="font-normal">
                  {s.invoicing_mode === 'eis' ? 'E-invoice (EIS)' : 'Manual invoice'}
                </Badge>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`branch-${s.id}`}>Branch code</Label>
                <Input id={`branch-${s.id}`} inputMode="numeric" value={s.branch_code} onChange={e => updateStore(s.id, { branch_code: e.target.value })} placeholder="00000" maxLength={5} className="max-w-[10rem]" />
                <p className="text-xs text-gray-500">Head office: 00000. Branch "101" is saved as 00101.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`ptu-${s.id}`}>PTU no.</Label>
                  <Input id={`ptu-${s.id}`} value={s.ptu_number || ''} onChange={e => updateStore(s.id, { ptu_number: e.target.value })} placeholder="Permit To Use" maxLength={50} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`min-${s.id}`}>MIN</Label>
                  <Input id={`min-${s.id}`} value={s.min_number || ''} onChange={e => updateStore(s.id, { min_number: e.target.value })} placeholder="Machine ID no." maxLength={50} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`msn-${s.id}`}>Serial no.</Label>
                  <Input id={`msn-${s.id}`} value={s.msn_number || ''} onChange={e => updateStore(s.id, { msn_number: e.target.value })} placeholder="Machine serial" maxLength={50} />
                </div>
              </div>
            </div>
          ))}
          <p className="text-xs text-gray-500">E-invoicing (sending each invoice to BIR) is coming soon. All stores use manual invoices for now.</p>
        </CardContent>
      </Card>

      {msg && (
        <Alert variant={msg.type === 'error' ? 'destructive' : 'default'} className={msg.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : ''}>
          {msg.type === 'success' && <CheckCircle className="h-4 w-4" />}
          <AlertDescription>{msg.text}</AlertDescription>
        </Alert>
      )}

      <Button onClick={save} disabled={saving} className="w-full">
        {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Save BIR Settings'}
      </Button>
    </div>
  )
}
