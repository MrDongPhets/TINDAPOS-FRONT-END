import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings, LogOut } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'

export function UserMenuDropdown() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const onStorage = () => forceUpdate(n => n + 1)
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const userData = localStorage.getItem('userData')
  const user = userData ? JSON.parse(userData) : null
  const initial = user?.name?.charAt(0)?.toUpperCase() || 'U'
  const avatarUrl = user?.avatar_url

  const handleLogout = () => {
    logout()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="shrink-0 h-8 w-8 rounded-full p-0 overflow-hidden">
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700 overflow-hidden">
            {avatarUrl
              ? <img src={avatarUrl} alt={user?.name || ''} className="w-full h-full object-cover" />
              : initial
            }
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => navigate('/client/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-600 focus:bg-red-50">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
