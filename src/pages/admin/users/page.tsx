import logger from '@/utils/logger'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/ui/app-sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Users, Search, RefreshCw, Loader2, AlertCircle, Mail, Phone, Shield, Clock } from 'lucide-react'
import API_CONFIG from '@/config/api'

const getRoleColor = (role: string) => {
  switch (role) {
    case 'manager':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'supervisor':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'staff':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getStatusColor = (isActive: boolean) => {
  return isActive
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-red-100 text-red-800 border-red-200'
}

function formatDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatRelative(iso: string) {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(iso)
}

function getInitials(name: string) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

const ROLE_AVATAR_BG: Record<string, string> = {
  manager: 'bg-purple-100 text-purple-700',
  supervisor: 'bg-blue-100 text-blue-700',
  staff: 'bg-gray-100 text-gray-600',
}

type FilterTab = 'all' | 'manager' | 'supervisor' | 'staff'

export default function AdminUsers() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<FilterTab>('all')

  useEffect(() => {
    const userData = localStorage.getItem('userData')
    if (userData) setUser(JSON.parse(userData))
    fetchUsers()
  }, [])

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    'Content-Type': 'application/json',
  })

  const makeApiCall = async (endpoint: string) => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      headers: getAuthHeaders(),
    })

    if (response.status === 401 || response.status === 403) {
      const errorData = await response.json()
      if (errorData.code === 'TOKEN_EXPIRED' || errorData.code === 'INVALID_TOKEN') {
        localStorage.removeItem('authToken')
        localStorage.removeItem('userData')
        localStorage.removeItem('userType')
        localStorage.removeItem('companyData')
        localStorage.removeItem('subscriptionData')
        alert('Your session has expired. Please log in again.')
        navigate('/system-admin')
        return null
      }
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    return response.json()
  }

  const fetchUsers = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setRefreshing(true)
      setError(null)

      logger.log('👥 Fetching users...')
      const data = await makeApiCall(API_CONFIG.ENDPOINTS.ADMIN.USERS)
      if (!data) return

      setUsers(data.users || [])
    } catch (err: any) {
      logger.error('Failed to fetch users:', err)
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const tabCounts = {
    all: users.length,
    manager: users.filter((u) => u.role === 'manager').length,
    supervisor: users.filter((u) => u.role === 'supervisor').length,
    staff: users.filter((u) => u.role === 'staff').length,
  }

  const filtered = users.filter((u) => {
    const matchesTab = tab === 'all' || u.role === tab
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q)
    return matchesTab && matchesSearch
  })

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'manager', label: 'Manager' },
    { key: 'supervisor', label: 'Supervisor' },
    { key: 'staff', label: 'Staff' },
  ]

  return (
    <SidebarProvider>
      <AppSidebar userType="super_admin" />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/admin/dashboard">Admin</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Users</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Content */}
        <div className="flex flex-col gap-6 p-6">
          {/* Title row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Users</h1>
                <p className="text-sm text-muted-foreground">All users registered across companies</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchUsers(true)}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>

          {/* Error */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="flex items-center gap-3 pt-4">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                <div>
                  <p className="font-medium text-red-800">Failed to load users</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
                <Button variant="outline" size="sm" className="ml-auto" onClick={() => fetchUsers()}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          {!loading && !error && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {users.filter((u) => u.is_active).length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Managers</p>
                  <p className="text-2xl font-bold text-purple-600">{tabCounts.manager}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Showing</p>
                  <p className="text-2xl font-bold">{filtered.length}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search + Role tabs */}
          {!loading && !error && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-1">
                {TABS.map((t) => (
                  <Button
                    key={t.key}
                    variant={tab === t.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTab(t.key)}
                  >
                    {t.label}
                    <span className="ml-1.5 text-xs opacity-70">{tabCounts[t.key]}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          )}

          {/* Users list */}
          {!loading && !error && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {filtered.length === 0
                    ? 'No users found'
                    : `${filtered.length} ${filtered.length === 1 ? 'user' : 'users'}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {filtered.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Users className="mx-auto h-10 w-10 mb-3 opacity-30" />
                    <p>{search ? 'No users match your search.' : 'No users registered yet.'}</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filtered.map((u) => (
                      <div key={u.id} className="flex items-center gap-4 px-6 py-3 hover:bg-muted/30 transition-colors">
                        {/* Avatar */}
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            ROLE_AVATAR_BG[u.role] || ROLE_AVATAR_BG.staff
                          }`}
                        >
                          {getInitials(u.name)}
                        </div>

                        {/* Name + email */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium truncate">{u.name}</span>
                            <Badge
                              className={`text-xs border capitalize ${getRoleColor(u.role)}`}
                              variant="outline"
                            >
                              <Shield className="h-3 w-3 mr-1" />
                              {u.role}
                            </Badge>
                            <Badge
                              className={`text-xs border ${getStatusColor(u.is_active)}`}
                              variant="outline"
                            >
                              {u.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                            {u.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {u.email}
                              </span>
                            )}
                            {u.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {u.phone}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Last login + joined */}
                        <div className="shrink-0 text-right text-xs text-muted-foreground hidden sm:block">
                          <div className="flex items-center justify-end gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatRelative(u.last_login)}</span>
                          </div>
                          <p className="mt-0.5">Joined {formatDate(u.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
