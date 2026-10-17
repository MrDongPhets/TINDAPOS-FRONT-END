import { StaffFinanceShell } from '../StaffFinanceShell'
import { ExpensesView } from '@/components/finance/ExpensesView'

export default function StaffExpensesPage() {
  return (
    <StaffFinanceShell title="Expenses" subtitle="Record store expenses">
      <ExpensesView isOwner={false} />
    </StaffFinanceShell>
  )
}
