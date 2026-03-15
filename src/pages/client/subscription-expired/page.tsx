import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CreditCard, LogOut, MessageCircle } from 'lucide-react'

export default function SubscriptionExpiredPage() {
  const { logout, user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-8 w-8 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscription Expired</h1>
          <p className="text-gray-600 mb-2">
            Hi <strong>{user?.name || 'there'}</strong>, your trial or subscription period has ended.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Your data is safe. Contact us to reactivate your account and continue using TindaPOS.
          </p>

          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left space-y-1">
            <p className="text-sm font-semibold text-blue-900">How to reactivate:</p>
            <p className="text-sm text-blue-700">1. Send payment via GCash / bank transfer</p>
            <p className="text-sm text-blue-700">2. Message us your company name + proof of payment</p>
            <p className="text-sm text-blue-700">3. We'll activate your account within the day</p>
            <p className="text-sm font-semibold text-blue-900 mt-2">Negosyo Plan: ₱299 / month (1 store)</p>
            <p className="text-sm font-semibold text-blue-900">Laking Negosyo Plan: ₱599 / month (5 stores)</p>
          </div>

          <div className="space-y-3">
            <a
              href="https://m.me/tindapos"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full bg-[#E8302A] hover:bg-[#B91C1C]">
                <MessageCircle className="mr-2 h-4 w-4" />
                Message Us to Subscribe
              </Button>
            </a>
            <Button variant="outline" className="w-full" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
