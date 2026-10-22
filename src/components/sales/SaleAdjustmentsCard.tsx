// Sale detail → the voids / returns made against this sale (Invoicing plan P0-7)
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Undo2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { correctionLabel, correctionStatusText, type SaleAdjustment } from '@/lib/saleAdjustments'

export function SaleAdjustmentsCard({ adjustments }: { adjustments: SaleAdjustment[] }) {
  if (!adjustments.length) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Undo2 className="h-5 w-5" /> Voids &amp; Returns ({adjustments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {adjustments.map(a => (
          <div key={a.id} className="rounded-lg border p-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold">{a.adjustment_no}</span>
                <Badge variant={a.kind === 'void' ? 'destructive' : 'secondary'}>{a.kind === 'void' ? 'VOID' : 'RETURN'}</Badge>
              </div>
              <span className="font-semibold text-red-600">-{formatCurrency(Number(a.total_amount))}</span>
            </div>
            <p className="text-xs text-gray-500">
              {new Date(a.created_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Manila' })} · {correctionLabel(a.correction_code)}
            </p>
            <ul className="text-sm space-y-0.5">
              {a.items.map(l => (
                <li key={l.sales_item_id} className="flex justify-between gap-2">
                  <span className="truncate">{l.quantity} × {l.name}</span>
                  <span className="text-gray-600 shrink-0">-{formatCurrency(l.amount)}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">Reason: {a.reason}</p>
            {(() => {
              const st = correctionStatusText(a.einvoice)
              if (!st) return null
              const tone = st.tone === 'ok' ? 'text-green-700' : st.tone === 'wait' ? 'text-amber-700' : 'text-red-700'
              return <p className={`text-xs font-medium ${tone}`}>{st.text}</p>
            })()}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
