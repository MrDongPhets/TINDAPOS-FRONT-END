// 1 / 6 / 12-month choice for a plan — "Best value" on 12 months, price per month + total billed
import { Crown } from 'lucide-react'
import {
  BEST_VALUE_MONTHS, BILLING_PERIODS, getPrice, peso, periodLabel,
  type BillingMonths, type PaidPlanId,
} from '@/config/pricing'

interface Props {
  plan: PaidPlanId
  value: BillingMonths
  onChange: (months: BillingMonths) => void
}

export default function BillingPeriodPicker({ plan, value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Billing period" className="space-y-3">
      {BILLING_PERIODS.map(months => {
        const { total, perMonth, savings } = getPrice(plan, months)
        const selected = value === months
        const bestValue = months === BEST_VALUE_MONTHS
        return (
          <button
            key={months}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(months)}
            className={`w-full text-left rounded-2xl bg-white px-4 py-3.5 flex items-center gap-4 transition-colors ${
              selected ? 'border-2 border-[#E8302A] bg-[#FFF1F0]' : 'border border-gray-200 hover:border-gray-300'
            }`}
          >
            <span
              className={`h-6 w-6 shrink-0 rounded-full flex items-center justify-center ${
                selected ? 'border-[7px] border-[#E8302A] bg-white' : 'border-2 border-gray-400'
              }`}
            />
            <span className="min-w-0 flex-1">
              {bestValue && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#E8302A] px-2 py-0.5 text-xs font-semibold text-white mb-1.5">
                  <Crown className="h-3 w-3" /> Best value
                </span>
              )}
              <span className="block text-base font-bold text-gray-900">
                {periodLabel(months)} · {peso(perMonth)} <span className="text-sm font-normal text-gray-500">/ mo.</span>
              </span>
              <span className="block text-sm text-gray-500">
                {peso(total)} billed every {months === 1 ? 'month' : periodLabel(months)}
                {savings > 0 && <span className="ml-1.5 font-semibold text-green-600">· Save {peso(savings)}</span>}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
