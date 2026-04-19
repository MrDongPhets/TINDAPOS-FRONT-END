import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useApiClient } from '@/hooks/useApiClient'
import { ClipboardList, Loader2, AlertCircle, Clock, ArrowLeft } from 'lucide-react'

type StockCount = {
  id: string
  status: 'draft' | 'submitted' | 'approved'
  created_at: string
  submitted_at: string | null
  stores: { name: string }
  users: { name: string }
}

export default function PosStockCountPage() {
  const { get } = useApiClient()
  const navigate = useNavigate()
  const [stockCounts, setStockCounts] = useState<StockCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const result = await get('/pos/stock-counts')
      setLoading(false)
      if (result?.success) {
        // Staff only sees draft counts (submitted/approved are done)
        const all = result.data?.stock_counts || []
        setStockCounts(all.filter((sc: StockCount) => sc.status === 'draft'))
      } else {
        setError(result?.error || 'Failed to load stock counts')
      }
    }
    init() // eslint-disable-line react-hooks/exhaustive-deps
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/pos')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-bold text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5" /> Stock Count
          </h1>
          <p className="text-xs text-gray-500">Open a draft to start counting</p>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-3 mt-2">
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : stockCounts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No pending stock counts</p>
            <p className="text-sm mt-1">Your owner/manager will create one when needed</p>
          </div>
        ) : (
          stockCounts.map(sc => (
            <div
              key={sc.id}
              onClick={() => navigate(`/pos/stock-count/${sc.id}`)}
              className="bg-white border rounded-xl p-4 hover:border-gray-400 hover:shadow-sm cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{sc.stores?.name}</span>
                    <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs gap-1">
                      <Clock className="h-3 w-3" /> Needs Count
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(sc.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className="text-gray-400 text-sm">Start →</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
