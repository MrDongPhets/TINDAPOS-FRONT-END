import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, Loader2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import API_CONFIG from '@/config/api'

export default function BillingSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const sessionId = searchParams.get('session_id')

  const [status, setStatus] = useState<'checking' | 'confirmed' | 'failed'>('checking')
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    if (!sessionId) { setStatus('failed'); return }
    pollStatus()
  }, [])

  const pollStatus = async () => {
    const token = localStorage.getItem('authToken')
    for (let i = 0; i < 12; i++) {
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/billing/status?session_id=${sessionId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        setAttempts(i + 1)
        if (data.paid) {
          setStatus('confirmed')
          // Clear cached subscription so AuthProvider re-fetches fresh data
          const companyData = localStorage.getItem('companyData')
          if (companyData) {
            const parsed = JSON.parse(companyData)
            parsed.subscription_status = 'active'
            parsed.subscription_end_date = data.company?.subscription_end_date
            localStorage.setItem('companyData', JSON.stringify(parsed))
          }
          return
        }
      } catch { /* network hiccup, keep polling */ }
      await new Promise(r => setTimeout(r, 3000))
    }
    setStatus('failed')
  }

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#E8302A] mx-auto" />
            <h1 className="text-xl font-bold">Confirming your payment…</h1>
            <p className="text-gray-500 text-sm">Please wait while we activate your subscription.</p>
            <p className="text-xs text-gray-400">Check {attempts}/12</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'confirmed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Confirmed!</h1>
            <p className="text-gray-600">Your subscription is now active. Welcome back!</p>
            <Button
              className="w-full bg-[#E8302A] hover:bg-[#B91C1C]"
              onClick={() => { window.location.href = '/client/dashboard' }}
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="h-8 w-8 text-yellow-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Payment still processing</h1>
          <p className="text-gray-500 text-sm">
            Your payment may still be processing. If you completed the payment, your account will be activated within a few minutes.
          </p>
          <div className="space-y-2">
            <Button className="w-full bg-[#E8302A] hover:bg-[#B91C1C]" onClick={pollStatus}>
              Check Again
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate('/subscription-expired')}>
              Back to Billing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
