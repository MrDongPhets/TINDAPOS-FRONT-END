import { FinancePageShell } from '../FinancePageShell'
import { GcashView } from '@/components/finance/GcashView'

export default function GcashPage() {
  return (
    <FinancePageShell title="GCash" subtitle="Cash-in / cash-out transactions and fees earned">
      <GcashView isOwner />
    </FinancePageShell>
  )
}
