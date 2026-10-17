import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

// Staff page frame (back to POS dashboard) for the GCash and Expenses pages
export function StaffFinanceShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate('/pos/dashboard')} className="text-gray-500 hover:text-gray-700 p-1" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="font-bold text-lg leading-tight">{title}</h1>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}
