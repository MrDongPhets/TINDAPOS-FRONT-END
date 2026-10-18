import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CreditCard, LogOut, Check, Store, Building2, RefreshCw } from 'lucide-react'
import BillingPeriodPicker from '@/components/billing/BillingPeriodPicker'
import SubscribeSteps from '@/components/billing/SubscribeSteps'
import { BEST_VALUE_MONTHS, PLAN_LABELS, getPrice, peso, toPaidPlanId, type BillingMonths, type PaidPlanId } from '@/config/pricing'

const ACTIVE_STATUSES = ['active', 'trial']
const RECHECK_INTERVAL_MS = 30000

const PLANS = [
  {
    id: 'negosyo' as PaidPlanId,
    name: 'Negosyo',
    stores: 1,
    icon: Store,
    color: 'border-[#E8302A]',
    perks: ['1 store', 'Up to 100 products', 'POS + offline mode', 'Sales reports', 'Utang tracker', 'Facebook support'],
  },
  {
    id: 'laking-negosyo' as PaidPlanId,
    name: 'Laking Negosyo',
    stores: 5,
    icon: Building2,
    color: 'border-purple-400',
    perks: ['Up to 5 stores', 'Unlimited products', 'POS + offline mode', 'Full reports', 'Staff management', 'Email support (coming soon)'],
  },
]

export default function SubscriptionExpiredPage() {
  const { logout, user, refreshSession } = useAuth()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)
  const [checkMessage, setCheckMessage] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<PaidPlanId>(() => {
    try { return toPaidPlanId(JSON.parse(localStorage.getItem('companyData') || '{}').subscription_plan) } catch { return 'negosyo' }
  })
  const [months, setMonths] = useState<BillingMonths>(BEST_VALUE_MONTHS)

  // Re-check subscription — once reactivated by admin/payment, send the user back in without re-login.
  // Returns the fresh company, or null if the server couldn't be reached.
  const recheck = useCallback(async () => {
    const company = await refreshSession()
    if (company && ACTIVE_STATUSES.includes(company.subscription_status)) {
      navigate('/client/dashboard', { replace: true })
    }
    return company
  }, [refreshSession, navigate])

  const handleManualCheck = async () => {
    setChecking(true)
    setCheckMessage('')
    const company = await recheck()
    setChecking(false)
    setCheckMessage(company ? "Still not active yet. We'll keep checking automatically." : 'Could not reach the server. Please try again.')
  }

  useEffect(() => {
    recheck()
    const interval = setInterval(recheck, RECHECK_INTERVAL_MS)
    window.addEventListener('focus', recheck)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', recheck)
    }
  }, [recheck])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start p-4 pt-10">
      <div className="w-full max-w-xl space-y-5">

        {/* Header */}
        <Card>
          <CardContent className="p-6 text-center space-y-2">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <CreditCard className="h-7 w-7 text-[#E8302A]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Subscription Expired</h1>
            <p className="text-gray-600 text-sm">
              Hi <strong>{user?.name || 'there'}</strong>, your trial or subscription has ended.
              Your data is safe — subscribe to continue using Tindapo POS.
            </p>
          </CardContent>
        </Card>

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PLANS.map(plan => {
            const Icon = plan.icon
            const isSelected = selectedPlan === plan.id
            return (
              <Card
                key={plan.name}
                role="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedPlan(plan.id)}
                className={`border-2 cursor-pointer transition-shadow ${isSelected ? `${plan.color} shadow-md` : 'border-gray-200'}`}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-bold text-gray-900">{plan.name}</p>
                      <p className="text-xl font-extrabold">
                        {peso(getPrice(plan.id, months).perMonth)}
                        <span className="text-sm font-normal text-gray-500">/month</span>
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {plan.perks.map(p => (
                      <li key={p} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Billing period */}
        <div>
          <p className="text-lg font-bold text-gray-900 mb-3">Select plan · {PLAN_LABELS[selectedPlan]}</p>
          <BillingPeriodPicker plan={selectedPlan} value={months} onChange={setMonths} />
        </div>

        {/* How to pay */}
        <SubscribeSteps plan={selectedPlan} months={months} />

        <div className="text-center space-y-2">
          <Button variant="outline" className="w-full" onClick={handleManualCheck} disabled={checking}>
            <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking...' : 'Already paid? Check my subscription'}
          </Button>
          {checkMessage && <p className="text-xs text-gray-500">{checkMessage}</p>}
          <Button variant="ghost" className="text-gray-500" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>

      </div>
    </div>
  )
}
