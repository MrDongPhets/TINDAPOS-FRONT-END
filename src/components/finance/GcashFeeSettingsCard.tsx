import { useEffect, useState } from 'react'
import { useApiClient } from '@/hooks/useApiClient'
import API_CONFIG from '@/config/api'
import { computeGcashFee, DEFAULT_FEE_RULE, describeFeeRule, GCASH_TYPE_LABELS, type FeeRule, type GcashSettings, type GcashType } from '@/lib/finance'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle, Loader2, Smartphone } from 'lucide-react'

const { GCASH_SETTINGS, GCASH_SETTINGS_SAVE } = API_CONFIG.ENDPOINTS.FINANCE

// Owner settings: how much the store charges for GCash cash-in / cash-out
export function GcashFeeSettingsCard() {
  const { get, put } = useApiClient()
  const [settings, setSettings] = useState<GcashSettings>({ cash_in: DEFAULT_FEE_RULE, cash_out: DEFAULT_FEE_RULE })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    get(GCASH_SETTINGS).then(res => {
      if (res?.success && res.data?.settings) setSettings(res.data.settings)
    })
  }, [get])

  const updateRule = (type: GcashType, patch: Partial<FeeRule>) =>
    setSettings(s => ({ ...s, [type]: { ...s[type], ...patch } }))

  const save = async () => {
    setSaving(true)
    setMsg(null)
    const res = await put(GCASH_SETTINGS_SAVE, settings)
    setSaving(false)
    if (res?.success) {
      setSettings(res.data?.settings || settings)
      setMsg({ type: 'success', text: 'GCash fees saved' })
    } else {
      setMsg({ type: 'error', text: res?.error || 'Failed to save GCash fees' })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-blue-600" /> GCash Fees
        </CardTitle>
        <CardDescription>How much your store charges for GCash cash-in and cash-out. Staff see this fee automatically.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {(['cash_in', 'cash_out'] as GcashType[]).map(type => {
          const rule = settings[type]
          return (
            <div key={type} className="rounded-xl border p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{GCASH_TYPE_LABELS[type].label}</p>
                <span className="text-xs text-gray-500">e.g. ₱1,000 → fee ₱{computeGcashFee(1000, rule)}</span>
              </div>

              <Select value={rule.mode} onValueChange={v => updateRule(type, { mode: v as FeeRule['mode'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bracket">Fixed fee per amount (e.g. ₱10 per ₱500)</SelectItem>
                  <SelectItem value="percent">Percentage (e.g. 2%)</SelectItem>
                </SelectContent>
              </Select>

              {rule.mode === 'bracket' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Fee (₱)</Label>
                    <Input type="number" min={0} value={rule.bracket_fee} onChange={e => updateRule(type, { bracket_fee: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Per every (₱)</Label>
                    <Input type="number" min={1} value={rule.bracket_amount} onChange={e => updateRule(type, { bracket_amount: Number(e.target.value) })} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Percent (%)</Label>
                    <Input type="number" min={0} step="0.1" value={rule.percent} onChange={e => updateRule(type, { percent: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Minimum fee (₱)</Label>
                    <Input type="number" min={0} value={rule.minimum_fee} onChange={e => updateRule(type, { minimum_fee: Number(e.target.value) })} />
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500">Current rule: {describeFeeRule(rule)}</p>
            </div>
          )
        })}

        {msg && (
          <Alert variant={msg.type === 'error' ? 'destructive' : 'default'} className={msg.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : ''}>
            {msg.type === 'success' && <CheckCircle className="h-4 w-4" />}
            <AlertDescription>{msg.text}</AlertDescription>
          </Alert>
        )}

        <Button onClick={save} disabled={saving} className="w-full">
          {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Save GCash Fees'}
        </Button>
      </CardContent>
    </Card>
  )
}
