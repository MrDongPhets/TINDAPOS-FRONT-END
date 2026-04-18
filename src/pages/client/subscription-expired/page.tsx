import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CreditCard, LogOut, MessageCircle, Check, Store, Building2 } from 'lucide-react'

const PLANS = [
  {
    name: 'Negosyo',
    price: '₱299',
    period: '/month',
    stores: 1,
    icon: Store,
    color: 'border-[#E8302A]',
    perks: ['1 store', 'Up to 100 products', 'POS + offline mode', 'Sales reports', 'Utang tracker', 'Facebook support'],
  },
  {
    name: 'Laking Negosyo',
    price: '₱599',
    period: '/month',
    stores: 5,
    icon: Building2,
    color: 'border-purple-400',
    perks: ['Up to 5 stores', 'Unlimited products', 'POS + offline mode', 'Full reports', 'Staff management', 'Email support (coming soon)'],
  },
]

export default function SubscriptionExpiredPage() {
  const { logout, user } = useAuth()

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
              Your data is safe — subscribe to continue using TindaPOS.
            </p>
          </CardContent>
        </Card>

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PLANS.map(plan => {
            const Icon = plan.icon
            return (
              <Card key={plan.name} className={`border-2 ${plan.color}`}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-bold text-gray-900">{plan.name}</p>
                      <p className="text-xl font-extrabold">
                        {plan.price}
                        <span className="text-sm font-normal text-gray-500">{plan.period}</span>
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

        {/* How to pay */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <p className="font-semibold text-gray-800">How to subscribe:</p>
            <ol className="space-y-1.5 text-sm text-gray-600 list-decimal list-inside">
              <li>Send payment via <strong>GCash / Maya / bank transfer</strong></li>
              <li>Message us on Facebook with:
                <ul className="mt-1 ml-4 space-y-0.5 list-none">
                  <li>• Your <strong>company name</strong></li>
                  <li>• Your <strong>registered email</strong></li>
                  <li>• <strong>Proof of payment</strong> (screenshot)</li>
                  <li>• <strong>Plan</strong> you want (Negosyo / Laking Negosyo)</li>
                </ul>
              </li>
              <li>We'll activate your account <strong>within the day</strong></li>
            </ol>
            <a
              href="https://m.me/61578527823519"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full bg-[#E8302A] hover:bg-[#B91C1C] mt-1">
                <MessageCircle className="mr-2 h-4 w-4" />
                Message Us on Facebook
              </Button>
            </a>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="ghost" className="text-gray-500" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>

      </div>
    </div>
  )
}
