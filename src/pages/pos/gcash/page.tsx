import { StaffFinanceShell } from '../StaffFinanceShell'
import { GcashView } from '@/components/finance/GcashView'

export default function StaffGcashPage() {
  return (
    <StaffFinanceShell title="GCash" subtitle="Cash-in / cash-out">
      <GcashView isOwner={false} />
    </StaffFinanceShell>
  )
}
