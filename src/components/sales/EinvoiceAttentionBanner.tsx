// Sales page: warn the owner when e-invoices need them (refused, connection problem, gave up, rejected by BIR) — P2-8.
// Shows nothing for manual-invoice stores (no e-invoices at all).
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApiClient } from '@/hooks/useApiClient'
import API_CONFIG from '@/config/api'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

export function EinvoiceAttentionBanner() {
  const { get } = useApiClient()
  const [count, setCount] = useState(0)

  useEffect(() => {
    let alive = true
    get(`${API_CONFIG.ENDPOINTS.BIR.EINVOICES}?filter=attention&limit=1`).then(res => {
      if (alive && res?.success) setCount(res.data.attention || 0)
    })
    return () => { alive = false }
  }, [get])

  if (!count) return null
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        {count} e-invoice{count > 1 ? 's' : ''} need{count > 1 ? '' : 's'} your attention.{' '}
        <Link to="/client/settings?tab=bir" className="font-semibold underline">Open e-invoice status</Link>
      </AlertDescription>
    </Alert>
  )
}
