import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { FACEBOOK_MESSENGER_URL } from '@/config/contact'

export default function RegisterSuccessPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">You're all set!</h1>
          <p className="mt-2 text-gray-500">
            Your Tindapo account has been created. Your 30-day free trial is now active.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 text-left space-y-3">
          <p className="text-sm font-semibold text-gray-700">What's next:</p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              Log in to your dashboard
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              Add your products and set up your store
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              Start selling with your free 30-day trial
            </li>
          </ul>
        </div>

        <Button
          className="w-full bg-[#E8302A] hover:bg-[#B91C1C] text-white gap-2"
          onClick={() => navigate('/login')}
        >
          Go to Login <ArrowRight className="h-4 w-4" />
        </Button>

        <p className="text-xs text-gray-400">
          Need help? Message us on{' '}
          <a
            href={FACEBOOK_MESSENGER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Facebook
          </a>
        </p>
      </div>
    </div>
  )
}
