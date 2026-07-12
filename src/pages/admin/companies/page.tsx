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
import { Building2, Search, RefreshCw, Loader2, AlertCircle, Mail, Phone, Globe, Hash } from 'lucide-react'
import API_CONFIG from '@/config/api'

const getStatusColor = (isActive: boolean) => {
  return isActive
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-red-100 text-red-800 border-red-200'
}

function formatDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function AdminCompanies() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companies, setCompanies] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const userData = localStorage.getItem('userData')
    if (userData) setUser(JSON.parse(userData))
    fetchCompanies()
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

  const fetchCompanies = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setRefreshing(true)
      setError(null)

      logger.log('🏢 Fetching companies...')
      const data = await makeApiCall(API_CONFIG.ENDPOINTS.ADMIN.COMPANIES)
      if (!data) return

      setCompanies(data.companies || [])
    } catch (err: any) {
      logger.error('Failed to fetch companies:', err)
      setError(err.message || 'Failed to load companies')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filtered = companies.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.name?.toLowerCase().includes(q) ||
      c.company_code?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.contact_email?.toLowerCase().includes(q)
    )
  })

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
                <BreadcrumbPage>Companies</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Content */}
        <div className="flex flex-col gap-6 p-6">
          {/* Title row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Companies</h1>
                <p className="text-sm text-muted-foreground">All registered companies in the system</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchCompanies(true)}
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
                  <p className="font-medium text-red-800">Failed to load companies</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
                <Button variant="outline" size="sm" className="ml-auto" onClick={() => fetchCompanies()}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Stats card */}
          {!loading && !error && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{companies.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {companies.filter((c) => c.is_active).length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Inactive</p>
                  <p className="text-2xl font-bold text-red-500">
                    {companies.filter((c) => !c.is_active).length}
                  </p>
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

          {/* Search */}
          {!loading && !error && (
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, code, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          )}

          {/* Companies list */}
          {!loading && !error && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {filtered.length === 0
                    ? 'No companies found'
                    : `${filtered.length} ${filtered.length === 1 ? 'company' : 'companies'}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {filtered.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Building2 className="mx-auto h-10 w-10 mb-3 opacity-30" />
                    <p>{search ? 'No companies match your search.' : 'No companies registered yet.'}</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filtered.map((company) => (
                      <div key={company.id} className="flex items-start gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                        {/* Avatar */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                          {company.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold truncate">{company.name}</span>
                            {company.company_code && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                <Hash className="h-3 w-3" />
                                {company.company_code}
                              </span>
                            )}
                            <Badge className={`text-xs border ${getStatusColor(company.is_active)}`} variant="outline">
                              {company.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>

                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                            {(company.email || company.contact_email) && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {company.email || company.contact_email}
                              </span>
                            )}
                            {(company.phone || company.contact_phone) && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {company.phone || company.contact_phone}
                              </span>
                            )}
                            {company.website && (
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {company.website}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Date */}
                        <div className="shrink-0 text-right text-xs text-muted-foreground">
                          <p>Registered</p>
                          <p className="font-medium">{formatDate(company.created_at)}</p>
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
