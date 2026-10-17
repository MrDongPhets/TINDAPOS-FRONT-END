import { FinancePageShell } from '../FinancePageShell'
import { ExpensesView } from '@/components/finance/ExpensesView'

export default function ExpensesPage() {
  return (
    <FinancePageShell title="Expenses" subtitle="Rent, kuryente, sahod, supplies — everything you spend">
      <ExpensesView isOwner />
    </FinancePageShell>
  )
}
