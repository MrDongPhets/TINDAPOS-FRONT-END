// @ts-nocheck
// src/components/ui/app-sidebar.jsx - Updated with Reports Dropdown

import { useState } from "react"
import { 
  Building2,
  Users,
  CreditCard,
  Crown,
  Activity,
  Server,
  Settings,
  ShoppingCart,
  Package,
  BarChart3,
  LogOut,
  Layers,
  Tag,
  ChevronDown,
  ChevronRight,
  Store,
  TrendingUp,
  DollarSign,
  PackageSearch,
  ArrowRightLeft,
  Beaker,
  HandCoins,
  FileText,
  ClipboardList
} from "lucide-react"
import { Link } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/components/auth/AuthProvider'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Super Admin navigation items
const superAdminNavigation = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: Activity,
  },
  {
    name: "Companies",
    href: "/admin/companies",
    icon: Building2,
  },
  {
    name: "Store Requests",
    href: "/admin/store-requests",
    icon: Store,
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    name: "Subscriptions",
    href: "/admin/subscriptions",
    icon: CreditCard,
  },
  {
    name: "System",
    href: "/admin/system",
    icon: Server,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

// Client navigation items with Inventory and Reports submenus
const clientNavigation = [
  {
    name: "Dashboard",
    href: "/client/dashboard",
    icon: Activity,
  },
  {
    name: "Stores",
    href: "/client/stores",
    icon: Store,
  },
  {
    name: "POS",
    href: "/client/pos",
    icon: ShoppingCart,
  },
  {
    name: "Sales Transactions",
    href: "/client/sales",
    icon: ShoppingCart,
  },
  {
    name: "Inventory",
    icon: Package,
    subItems: [
      {
        name: "Products",
        href: "/client/inventory/products",
        icon: Package,
      },
      {
        name: "Categories", 
        href: "/client/inventory/categories",
        icon: Tag,
      },
      {
      name: "Ingredients",
      href: "/client/inventory/ingredients",
      icon: Beaker,  
     },
      {
        name: "Stock Count",
        href: "/client/inventory/stock-count",
        icon: ClipboardList,
      },
      {
        name: "Stock Movement",
        href: "/client/inventory/tracking",
        icon: Layers,
      },
      {
        name: "Stock Ingredients Movement",
        href: "/client/inventory/ingredients-tracking",
        icon: Layers,
      }
    ]
  },
  {
    name: "Inventory Transfer",
    href: "/client/inventory/transfer",
    icon: ArrowRightLeft, 
  },
  {
    name: "Staff",
    href: "/client/staff",
    icon: Users,
  },
  {
    name: "Utang Tracker",
    href: "/client/utang",
    icon: HandCoins,
  },
  {
    name: "Reports",
    icon: BarChart3,
    subItems: [
      {
        name: "Reports & Analytics",
        href: "/client/reports",
        icon: TrendingUp,
      },
      {
        name: "Sales Reports",
        href: "/client/reports/sales",
        icon: TrendingUp,
      },
      {
        name: "Inventory Reports",
        href: "/client/reports/inventory",
        icon: PackageSearch,
      },
      {
        name: "Financial Reports",
        href: "/client/reports/financial",
        icon: DollarSign,
      },
      {
        name: "Z-Reading (BIR)",
        href: "/client/reports/z-reading",
        icon: FileText,
      }
    ]
  },
  {
    name: "Settings",
    href: "/client/settings",
    icon: Settings,
  },
]

export function AppSidebar({ userType = "client", user = null, company = null }) {
  const { pathname } = useLocation()
  const { state } = useSidebar()
  const { logout } = useAuth()
  const [inventoryExpanded, setInventoryExpanded] = useState(pathname.startsWith('/client/inventory'))
  const [reportsExpanded, setReportsExpanded] = useState(pathname.startsWith('/client/reports'))

  // Determine which navigation to use
  const navigation = userType === "super_admin" ? superAdminNavigation : clientNavigation

  // Determine branding
  const isAdmin = userType === "super_admin"
  const brandName = isAdmin ? "Admin Portal" : (company?.name || "Business")
  const BrandIcon = isAdmin ? Crown : Building2

  const handleLogout = () => {
    logout()
  }

  const getUserInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return isAdmin ? 'SA' : 'U'
  }

  const isCollapsed = state === "collapsed"

  return (
    <Sidebar collapsible="icon">
      {/* Sidebar Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to={isAdmin ? "/admin/dashboard" : "/client/dashboard"}>
                <div className={`flex aspect-square size-8 items-center justify-center rounded-lg ${isAdmin ? 'bg-purple-600 text-white' : 'bg-white border border-[#F0F0F5]'}`}>
                  {isAdmin ? <BrandIcon className="size-4" /> : <img src="/NEW-pos-logo.png" alt="TindaPOS" className="size-6 object-contain" />}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{brandName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {isAdmin ? 'Administration' : 'Business Portal'}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Sidebar Content */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                // Handle items with submenus (Inventory and Reports)
                if (item.subItems) {
                  const isActive = pathname.startsWith(item.subItems[0].href.split('/').slice(0, 3).join('/'))
                  const isInventory = item.name === "Inventory"
                  const isReports = item.name === "Reports"
                  const isExpanded = isInventory ? inventoryExpanded : reportsExpanded
                  const setExpanded = isInventory ? setInventoryExpanded : setReportsExpanded
                  
                  // When collapsed, show as dropdown
                  if (isCollapsed) {
                    return (
                      <SidebarMenuItem key={item.name}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <SidebarMenuButton 
                              isActive={isActive}
                              tooltip={item.name}
                            >
                              <item.icon />
                              <span>{item.name}</span>
                            </SidebarMenuButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="right" align="start" className="w-48">
                            {item.subItems.map((subItem) => (
                              <DropdownMenuItem key={subItem.name} asChild>
                                <Link to={subItem.href} className="cursor-pointer">
                                  <subItem.icon className="mr-2 h-4 w-4" />
                                  {subItem.name}
                                </Link>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuItem>
                    )
                  }
                  
                  // When expanded, show as collapsible list
                  return (
                    <div key={item.name}>
                      <SidebarMenuItem>
                        <SidebarMenuButton 
                          onClick={() => setExpanded(!isExpanded)}
                          isActive={isActive}
                          className="cursor-pointer"
                        >
                          <item.icon />
                          <span>{item.name}</span>
                          {isExpanded ? (
                            <ChevronDown className="ml-auto h-4 w-4" />
                          ) : (
                            <ChevronRight className="ml-auto h-4 w-4" />
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      
                      {/* Sub-items */}
                      {isExpanded && (
                        <div className="ml-6 mt-1 space-y-1">
                          {item.subItems.map((subItem) => {
                            const isSubItemActive = pathname === subItem.href
                            return (
                              <SidebarMenuItem key={subItem.name}>
                                <SidebarMenuButton asChild isActive={isSubItemActive} size="sm">
                                  <Link to={subItem.href} className="text-sm">
                                    <subItem.icon className="h-4 w-4" />
                                    <span>{subItem.name}</span>
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                }
                
                // Regular menu items with tooltip support when collapsed
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      tooltip={item.name}
                    >
                      <Link to={item.href} target={item.target}>
                        <item.icon />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Sidebar Footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-gray-200 text-gray-600 text-sm">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.name || (isAdmin ? 'Super Admin' : 'User')}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email || 'No email'}
                    </span>
                  </div>
                  <ChevronDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link to="/client/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}