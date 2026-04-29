import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ShoppingCart, Package, ShoppingBag, BarChart2, Users, Wallet, Plus, X, LayoutDashboard
} from 'lucide-react'

const QUICK_ACTIONS = [
  { label: 'Open POS',   icon: ShoppingCart,     bg: 'bg-[#E8302A]', path: '/client/pos' },
  { label: 'Products',   icon: Package,          bg: 'bg-blue-500',  path: '/client/inventory/products' },
  { label: 'Sales',      icon: ShoppingBag,      bg: 'bg-green-500', path: '/client/sales' },
  { label: 'Reports',    icon: BarChart2,         bg: 'bg-purple-500',path: '/client/reports' },
  { label: 'Staff',      icon: Users,            bg: 'bg-orange-500',path: '/client/staff' },
  { label: 'Utang',      icon: Wallet,           bg: 'bg-yellow-500',path: '/client/utang' },
  { label: 'Dashboard',  icon: LayoutDashboard,  bg: 'bg-sky-500',   path: '/client/dashboard' },
]

// Pages where FAB should NOT appear
const EXCLUDED_PATHS = [
  '/client/pos',
  '/client/pos/settings',
  '/client/subscription-expired',
]

export function QuickActionsFAB() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  // Only show on /client/* routes, excluding POS and subscription-expired
  const isClientRoute = pathname.startsWith('/client/')
  const isExcluded = EXCLUDED_PATHS.some(p => pathname.startsWith(p))
  if (!isClientRoute || isExcluded) return null

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
      <div className="hidden md:flex fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] right-6 z-50 flex-col items-end gap-3">
        {open && (
          <div className="flex flex-col items-end gap-2.5 mb-1">
            {[...QUICK_ACTIONS].reverse().map(({ label, icon: Icon, bg, path }, i) => (
              <div
                key={label}
                className="fab-item flex items-center gap-3"
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <span className="bg-white text-gray-800 text-sm font-medium px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap select-none">
                  {label}
                </span>
                <button
                  onClick={() => { setOpen(false); navigate(path) }}
                  className={`fab-icon-btn w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white ${bg}`}
                >
                  <Icon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => setOpen(prev => !prev)}
          className={`fab-icon-btn w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white ${
            open ? 'bg-blue-500' : 'bg-[#E8302A]'
          }`}
        >
          <span
            key={String(open)}
            style={{ animation: 'fab-spin-in 0.2s ease forwards' }}
            className="flex items-center justify-center"
          >
            {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
          </span>
        </button>
      </div>
    </>
  )
}
