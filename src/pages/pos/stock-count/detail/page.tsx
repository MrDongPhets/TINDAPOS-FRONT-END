import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApiClient } from '@/hooks/useApiClient'
import { Loader2, AlertCircle, CheckCircle, Save, Send, ArrowLeft, Package } from 'lucide-react'

type CountItem = {
  id: string
  product_id: string
  actual_qty: number | null
  notes: string | null
  products: { id: string; name: string; sku: string; stock_quantity: number }
}

type StockCount = {
  id: string
  status: 'draft' | 'submitted' | 'approved'
  created_at: string
  stores: { name: string }
  users: { name: string }
}

export default function PosStockCountDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { get, put, post } = useApiClient()

  const [stockCount, setStockCount] = useState<StockCount | null>(null)
  const [items, setItems] = useState<CountItem[]>([])
  const [edited, setEdited] = useState<Record<string, { actual_qty: string; notes: string }>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const result = await get(`/pos/stock-counts/${id}`)
      setLoading(false)
      if (result?.success) {
        setStockCount(result.data.stock_count)
        setItems(result.data.items || [])
        const initEdited: Record<string, { actual_qty: string; notes: string }> = {}
        for (const item of result.data.items || []) {
          initEdited[item.id] = {
            actual_qty: item.actual_qty != null ? String(item.actual_qty) : '',
            notes: item.notes || '',
          }
        }
        setEdited(initEdited)
      } else {
        setError(result?.error || 'Failed to load stock count')
      }
    }
    if (id) init() // eslint-disable-line react-hooks/exhaustive-deps
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (itemId: string, field: 'actual_qty' | 'notes', value: string) => {
    setEdited(prev => ({ ...prev, [itemId]: { ...prev[itemId], [field]: value } }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    const payload = items.map(item => ({
      id: item.id,
      actual_qty: edited[item.id]?.actual_qty !== '' ? parseFloat(edited[item.id]?.actual_qty) : null,
      notes: edited[item.id]?.notes || null,
    }))
    const result = await put(`/pos/stock-counts/${id}/items`, { items: payload })
    setSaving(false)
    if (result?.success) {
      setSuccess('Saved')
      setTimeout(() => setSuccess(''), 2000)
    } else {
      setError(result?.error || 'Failed to save')
    }
  }

  const handleSubmit = async () => {
    await handleSave()
    setSubmitting(true)
    const result = await post(`/pos/stock-counts/${id}/submit`, {})
    setSubmitting(false)
    if (result?.success) {
      setSuccess('Submitted for owner review!')
      setTimeout(() => navigate('/pos/stock-count'), 1500)
    } else {
      setError(result?.error || 'Failed to submit')
    }
  }

  const filledCount = items.filter(item => edited[item.id]?.actual_qty !== '').length
  const isDraft = stockCount?.status === 'draft'

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sticky Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate('/pos/stock-count')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-base truncate">
            {stockCount?.stores?.name} — Stock Count
          </h1>
          <p className="text-xs text-gray-500">
            {new Date(stockCount?.created_at || '').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        {isDraft && (
          <span className="text-xs text-gray-400 shrink-0">
            {filledCount}/{items.length} counted
          </span>
        )}
      </div>

      {/* Progress bar */}
      {isDraft && items.length > 0 && (
        <div className="h-1 bg-gray-200">
          <div
            className="h-1 bg-[#E8302A] transition-all duration-300"
            style={{ width: `${(filledCount / items.length) * 100}%` }}
          />
        </div>
      )}

      <div className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4">
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

        {!isDraft && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0 text-amber-500" />
            This count has been submitted. Waiting for owner approval.
          </div>
        )}

        {/* Instruction */}
        {isDraft && (
          <div className="text-sm text-gray-500 flex items-center gap-2 bg-white border rounded-xl px-3 py-2.5">
            <Package className="h-4 w-4 text-gray-400 shrink-0" />
            Physically count each product and enter the exact quantity you see on the shelf.
          </div>
        )}

        {/* Items */}
        <div className="bg-white border rounded-xl overflow-hidden divide-y divide-gray-100">
          {items.map((item) => {
            const filled = edited[item.id]?.actual_qty !== ''
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 px-4 py-3 ${filled && isDraft ? 'bg-green-50/50' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{item.products?.name}</p>
                  {item.products?.sku && (
                    <p className="text-xs text-gray-400">{item.products.sku}</p>
                  )}
                </div>
                {isDraft ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <Input
                      type="number"
                      min="0"
                      className={`w-20 text-center h-9 font-semibold ${filled ? 'border-green-300 bg-green-50' : ''}`}
                      value={edited[item.id]?.actual_qty ?? ''}
                      onChange={e => handleChange(item.id, 'actual_qty', e.target.value)}
                      placeholder="0"
                    />
                    {filled && <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />}
                  </div>
                ) : (
                  <span className="font-semibold text-gray-700 shrink-0">{item.actual_qty ?? '—'}</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Actions */}
        {isDraft && (
          <div className="flex gap-3 pb-4">
            <Button variant="outline" onClick={handleSave} disabled={saving} className="flex-1 gap-2 h-11">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Draft
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || filledCount === 0}
              className="flex-1 gap-2 h-11"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit for Review
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
