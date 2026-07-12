import logger from '@/utils/logger'
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/ui/app-sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  Monitor,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Database,
  Zap,
  Shield,
  Users,
  CreditCard,
} from 'lucide-react'
import API_CONFIG from '@/config/api'

type HealthStatus = 'healthy' | 'degraded' | 'error' | 'loading'

function StatusBadge({ status }: { status: string }) {
  if (status === 'healthy' || status === 'connected') {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 border" variant="outline">
        <CheckCircle2 className="h-3 w-3 mr-1" /> {status}
      </Badge>
    )
  }
  if (status === 'degraded' || status === 'disconnected') {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 border" variant="outline">
        <AlertTriangle className="h-3 w-3 mr-1" /> {status}
      </Badge>
    )
  }
  return (
    <Badge className="bg-red-100 text-red-800 border-red-200 border" variant="outline">
      <XCircle className="h-3 w-3 mr-1" /> {status}
    </Badge>
  )
}

export default function AdminSystem() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [health, setHealth] = useState<any>(null)
  const [userStats, setUserStats] = useState<any>(null)
  const [subStats, setSubStats] = useState<any>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    'Content-Type': 'application/json',
  })

  const makeAuthCall = async (endpoint: string) => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      headers: getAuthHeaders(),
    })
    if (response.status === 401 || response.status === 403) {
      const errorData = await response.json()
      if (errorData.code === 'TOKEN_EXPIRED' || errorData.code === 'INVALID_TOKEN') {
        localStorage.clear()
        alert('Your session has expired. Please log in again.')
        navigate('/system-admin')
        return null
      }
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  }

  const fetchAll = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setRefreshing(true)

      const [healthData, usersData, subsData] = await Promise.allSettled([
        fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`).then((r) => r.json()),
        makeAuthCall(API_CONFIG.ENDPOINTS.ADMIN.USERS_STATS),
        makeAuthCall(API_CONFIG.ENDPOINTS.ADMIN.SUBSCRIPTION_STATS),
      ])

      if (healthData.status === 'fulfilled') setHealth(healthData.value)
      if (usersData.status === 'fulfilled' && usersData.value) setUserStats(usersData.value)
      if (subsData.status === 'fulfilled' && subsData.value) setSubStats(subsData.value)

      setLastUpdated(new Date())
    } catch (err) {
      logger.error('System fetch error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(() => fetchAll(true), 30000)
    return () => clearInterval(interval)
  }, [fetchAll])

  const overallStatus: HealthStatus = health
    ? health.status === 'healthy'
      ? 'healthy'
      : health.status === 'degraded'
      ? 'degraded'
      : 'error'
    : 'loading'

  const overallBg = {
    healthy: 'border-green-200 bg-green-50',
    degraded: 'border-yellow-200 bg-yellow-50',
    error: 'border-red-200 bg-red-50',
    loading: 'border-gray-200 bg-gray-50',
  }[overallStatus]

  const overallIcon = {
    healthy: <CheckCircle2 className="h-6 w-6 text-green-600" />,
    degraded: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
    error: <XCircle className="h-6 w-6 text-red-600" />,
    loading: <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />,
  }[overallStatus]

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
                <BreadcrumbPage>System</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Content */}
        <div className="flex flex-col gap-6 p-6">
          {/* Title row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">System</h1>
                <p className="text-sm text-muted-foreground">
                  Live health status and platform statistics
                  {lastUpdated && (
                    <span className="ml-2 opacity-60">
                      · Updated {lastUpdated.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAll(true)}
              disabled={refreshing || loading}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>

          {/* Overall status banner */}
          <Card className={`border ${overallBg}`}>
            <CardContent className="flex items-center gap-4 pt-4">
              {overallIcon}
              <div>
                <p className="font-semibold capitalize">
                  {loading ? 'Checking system status…' : `System is ${overallStatus}`}
                </p>
                {health?.response_time_ms !== undefined && (
                  <p className="text-sm text-muted-foreground">
                    API response time: {health.response_time_ms}ms
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Health cards row */}
              <div className="grid gap-4 md:grid-cols-3">
                {/* API */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      <Zap className="h-4 w-4 text-primary" />
                      API Server
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      {health ? <StatusBadge status={health.status} /> : <span className="text-sm">—</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Port</span>
                      <span className="text-sm font-medium">{health?.port ?? '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Response</span>
                      <span className="text-sm font-medium">
                        {health?.response_time_ms !== undefined ? `${health.response_time_ms}ms` : '—'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Database */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      <Database className="h-4 w-4 text-primary" />
                      Database
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      {health ? <StatusBadge status={health.database} /> : <span className="text-sm">—</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Provider</span>
                      <span className="text-sm font-medium">Supabase</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Companies</span>
                      <span className="text-sm font-medium">{health?.company_count ?? '—'}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Auth */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      <Shield className="h-4 w-4 text-primary" />
                      Auth
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">JWT</span>
                      {health?.auth?.jwt_configured ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200 border" variant="outline">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Configured
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 border-red-200 border" variant="outline">
                          <XCircle className="h-3 w-3 mr-1" /> Missing
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Endpoints</span>
                      {health?.auth?.endpoints_active ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200 border" variant="outline">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 border-red-200 border" variant="outline">
                          <XCircle className="h-3 w-3 mr-1" /> Down
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">CORS</span>
                      {health?.cors?.enabled ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200 border" variant="outline">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Enabled
                        </Badge>
                      ) : (
                        <span className="text-sm">—</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Stats row */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* User stats */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      <Users className="h-4 w-4 text-primary" />
                      User Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {userStats ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total active users</span>
                          <span className="font-bold text-lg">{userStats.totalUsers}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">New last 30 days</span>
                          <span className="font-medium text-green-600">+{userStats.recentUsers}</span>
                        </div>
                        <Separator />
                        <div className="space-y-1.5">
                          {Object.entries(userStats.roleDistribution || {}).map(([role, count]) => (
                            <div key={role} className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground capitalize">{role}</span>
                              <span className="text-sm font-medium">{count as number}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Could not load user stats.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Subscription stats */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      <CreditCard className="h-4 w-4 text-primary" />
                      Subscription Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {subStats ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Active subscriptions</span>
                          <span className="font-bold text-lg">{subStats.totalSubscriptions}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total revenue</span>
                          <span className="font-medium">
                            ₱{Number(subStats.totalRevenue || 0).toFixed(2)}
                          </span>
                        </div>
                        <Separator />
                        <div className="space-y-1.5">
                          {Object.entries(subStats.planDistribution || {}).map(([plan, count]) => (
                            <div key={plan} className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground capitalize">{plan}</span>
                              <span className="text-sm font-medium">{count as number}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Could not load subscription stats.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
