// "How to subscribe" — manual payment, with the exact plan, period and amount the owner picked
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FACEBOOK_MESSENGER_URL } from '@/config/contact'
import { getPrice, peso, periodLabel, PLAN_LABELS, type BillingMonths, type PaidPlanId } from '@/config/pricing'

export default function SubscribeSteps({ plan, months }: { plan: PaidPlanId; months: BillingMonths }) {
  const { total } = getPrice(plan, months)
  const choice = `${PLAN_LABELS[plan]} · ${periodLabel(months)}`

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
          <span className="text-sm text-gray-600">{choice}</span>
          <span className="text-lg font-extrabold text-gray-900">{peso(total)}</span>
        </div>
        <p className="font-semibold text-gray-800">How to subscribe:</p>
        <ol className="space-y-1.5 text-sm text-gray-600 list-decimal list-inside">
          <li>Send <strong>{peso(total)}</strong> via <strong>GCash / Maya / bank transfer</strong></li>
          <li>Message us on Facebook with:
            <ul className="mt-1 ml-4 space-y-0.5 list-none">
              <li>• Your <strong>company name</strong></li>
              <li>• Your <strong>registered email</strong></li>
              <li>• <strong>Proof of payment</strong> (screenshot)</li>
              <li>• Your plan: <strong>{choice}</strong></li>
            </ul>
          </li>
          <li>We'll activate your account <strong>within the day</strong></li>
        </ol>
        <a href={FACEBOOK_MESSENGER_URL} target="_blank" rel="noopener noreferrer">
          <Button className="w-full bg-[#E8302A] hover:bg-[#B91C1C] mt-1">
            <MessageCircle className="mr-2 h-4 w-4" />
            Message Us on Facebook
          </Button>
        </a>
      </CardContent>
    </Card>
  )
}
