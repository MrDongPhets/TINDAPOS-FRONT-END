import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/components/auth/AuthProvider'
import { useState } from 'react'
import {
  LayoutDashboard, ShoppingCart, Package, BarChart3, Menu,
  Store, Users, ArrowRightLeft, HandCoins, Settings, ClipboardList,
  X, ChevronRight, Tag, Beaker, Layers, FileText, TrendingUp,
  DollarSign, PackageSearch, Gift
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

const mainTabs = [
  { label: 'Home',      icon: LayoutDashboard, href: '/client/dashboard' },
  { label: 'POS',       icon: ShoppingCart,    href: '/client/pos' },
  { label: 'Inventory', icon: Package,          href: '/client/inventory/products' },
  { label: 'Reports',   icon: BarChart3,        href: '/client/reports' },
]

const menuItems = [
  {
    group: 'Operations',
    items: [
      { label: 'Sales Transactions', icon: ShoppingCart, href: '/client/sales' },
      { label: 'Stores',             icon: Store,        href: '/client/stores' },
      { label: 'Staff',              icon: Users,        href: '/client/staff' },
      { label: 'Utang Tracker',      icon: HandCoins,    href: '/client/utang' },
      { label: 'Inventory Transfer', icon: ArrowRightLeft, href: '/client/inventory/transfer' },
    ]
  },
  {
    group: 'Inventory',
    items: [
      { label: 'Products',           icon: Package,      href: '/client/inventory/products' },
      { label: 'Bundles',            icon: Gift,         href: '/client/inventory/bundles' },
      { label: 'Categories',         icon: Tag,          href: '/client/inventory/categories' },
      { label: 'Ingredients',        icon: Beaker,       href: '/client/inventory/ingredients' },
      { label: 'Stock Count',        icon: ClipboardList, href: '/client/inventory/stock-count' },
      { label: 'Stock Movement',     icon: Layers,       href: '/client/inventory/tracking' },
    ]
  },
  {
    group: 'Reports',
    items: [
      { label: 'Sales Reports',      icon: TrendingUp,   href: '/client/reports/sales' },
      { label: 'Inventory Reports',  icon: PackageSearch, href: '/client/reports/inventory' },
      { label: 'Financial Reports',  icon: DollarSign,   href: '/client/reports/financial' },
      { label: 'Z-Reading (BIR)',    icon: FileText,     href: '/client/reports/z-reading' },
    ]
  },
  {
    group: 'Account',
    items: [
      { label: 'Settings', icon: Settings, href: '/client/settings' },
    ]
  }
]

export function MobileBottomNav() {
  const { userType } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  // Only show for client users, and not on POS or staff routes
  if (userType !== 'client') return null
  if (
    pathname.startsWith('/pos') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/staff') ||
    pathname.startsWith('/client/pos')
  ) return null

  const isTabActive = (href: string) => {
    if (href === '/client/dashboard') return pathname === href
    if (href === '/client/inventory/products') return pathname.startsWith('/client/inventory')
    if (href === '/client/reports') return pathname.startsWith('/client/reports')
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex items-stretch">
          {mainTabs.map(tab => {
            const active = isTabActive(tab.href)
            return (
              <Link
                key={tab.href}
                to={tab.href}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
                  active ? 'text-[#E8302A]' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <tab.icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className={`text-[10px] font-medium ${active ? 'text-[#E8302A]' : 'text-gray-400'}`}>
                  {tab.label}
                </span>
                {active && <div className="absolute bottom-0 w-8 h-0.5 bg-[#E8302A] rounded-t" />}
              </Link>
            )
          })}

          {/* Menu tab */}
          <button
            onClick={() => setMenuOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
              menuOpen ? 'text-[#E8302A]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Menu className="h-5 w-5 stroke-2" />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        </div>
      </nav>

      {/* Slide-up Menu Sheet */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="bottom" className="md:hidden max-h-[80vh] rounded-t-2xl px-0 pb-[env(safe-area-inset-bottom,16px)]">
          <SheetHeader className="px-4 pb-2 border-b">
            <SheetTitle className="text-left text-base">Menu</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto">
            {menuItems.map(group => (
              <div key={group.group}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 pt-4 pb-1">
                  {group.group}
                </p>
                {group.items.map(item => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <button
                      key={item.href}
                      onClick={() => { navigate(item.href); setMenuOpen(false) }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        active ? 'bg-red-50 text-[#E8302A]' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-[#E8302A]' : 'text-gray-400'}`} />
                      <span className="text-sm font-medium">{item.label}</span>
                      <ChevronRight className="ml-auto h-4 w-4 text-gray-300 shrink-0" />
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
