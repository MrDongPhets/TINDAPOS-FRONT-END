// src/components/layout/dashboard-layout.jsx

import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Building2,
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Menu,
  ChevronDown,
  Home,
  User,
  LogOut,
  Loader2,
} from "lucide-react"
import authService from "@/services/authService"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Companies",
    href: "/dashboard/companies",
    icon: Building2,
  },
  {
    title: "Users",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: FileText,
  },
  {
    title: "System Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

// Simple Logout Button Component (inline)
function LogoutMenuItem() {
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await authService.logout()
      navigate("/login")
    } catch (error) {
      console.error("Logout error:", error)
      navigate("/login")
    }
  }

  return (
    <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
      {isLoggingOut ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing out...
        </>
      ) : (
        <>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </>
      )}
    </DropdownMenuItem>
  )
}

export function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState(null)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  // Load user data on mount
  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
    } else if (typeof window !== 'undefined') {
      // Check localStorage for user data
      const savedUser = localStorage.getItem('userData')
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser))
        } catch (e) {
          console.error('Error parsing user data:', e)
        }
      }
    }
  }, [])

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return "SA"
    const names = user.name.split(' ')
    if (names.length >= 2) {
      return names[0][0] + names[names.length - 1][0]
    }
    return user.name.substring(0, 2).toUpperCase()
  }

  // Get role display name
  const getRoleDisplayName = () => {
    if (!user?.role) return "Admin"
    const roleMap = {
      'super_admin': 'Super Admin',
      'manager': 'Manager',
      'cashier': 'Cashier',
      'staff': 'Staff'
    }
    return roleMap[user.role] || user.role
  }

  const Sidebar = () => (
    <div className="flex h-full flex-col bg-white border-r">
      {/* Header */}
      <div className="flex h-16 items-center px-6 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Admin Panel</h2>
            <p className="text-xs text-gray-500">POS System</p>
          </div>
        </div>
      </div>

      {/* Platform Section */}
      <div className="p-4">
        <p className="text-xs font-medium text-gray-500 mb-3">Platform</p>
        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                  isActive
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User Section */}
      <div className="mt-auto p-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 p-2 h-auto"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{user?.name || 'Super Admin'}</p>
                <p className="text-xs text-gray-500">{getRoleDisplayName()}</p>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.name || 'Super Admin'}</p>
              <p className="text-xs text-gray-500">{user?.email || 'admin@techcorp.com'}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/dashboard/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/dashboard/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <LogoutMenuItem />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-1 text-sm text-gray-500">
              <Home className="h-4 w-4" />
              <span>/</span>
              <span>Admin Dashboard</span>
              {pathname !== "/dashboard" && (
                <>
                  <span>/</span>
                  <span className="text-gray-900 capitalize">
                    {pathname.split("/").pop()}
                  </span>
                </>
              )}
            </nav>
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Welcome, {user?.name || 'Admin'}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <LogoutMenuItem />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}