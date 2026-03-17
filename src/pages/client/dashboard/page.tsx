import { formatCurrency } from '@/lib/utils'
// src/app/client/dashboard/page.jsx - Simple version without context
import logger from '@/utils/logger';

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/ui/app-sidebar"
import { SimpleStoreSelector } from "@/components/store/SimpleStoreSelector"
import { useStores } from "@/hooks/useStores"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import {
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  RefreshCw,
  Loader2,
  AlertCircle,
  Building2,
  Store as StoreIcon,
  Copy,
  Check,
  Clock,
  CreditCard,
  AlertTriangle,
  WifiOff,
} from "lucide-react"
import API_CONFIG from "@/config/api"

export default function ClientDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [company, setCompany] = useState(null)
  const [companyCode, setCompanyCode] = useState<string | null>(null)
  const [codeCopied, setCodeCopied] = useState(false)
  const [subscription, setSubscription] = useState<{ status: string; days_left: number | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [networkDown, setNetworkDown] = useState(false)
  
  // Use the simple store hook
  const {
    stores,
    selectedStore,
    viewMode,
    isAllStoresView,
    fetchStores,
    selectStore,
    toggleViewMode,
    getApiUrl
  } = useStores()
  
  // Dashboard data
  const [dashboardData, setDashboardData] = useState({
    overview: {
      totalSales: 0,
      totalProducts: 0,
      totalStaff: 0,
      lowStockItems: 0
    },
    recentSales: [],
    lowStockProducts: [],
    topProducts: [],
    stores: []
  })

  useEffect(() => {
    const userData = localStorage.getItem('userData')
    const companyData = localStorage.getItem('companyData')
    
    if (userData) setUser(JSON.parse(userData))
    if (companyData) setCompany(JSON.parse(companyData))

    // Fetch stores, dashboard data, and company code
    fetchStores()
    fetchDashboardData()
    fetchCompanyCode()
  }, [])

  // Refetch data when store selection changes
  useEffect(() => {
    if (stores.length > 0) {
      fetchDashboardData()
    }
  }, [selectedStore, isAllStoresView, stores])

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const fetchCompanyCode = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch(`${API_CONFIG.BASE_URL}/client/company`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      if (data.company?.company_code) setCompanyCode(data.company.company_code)
      if (data.company?.subscription_status) {
        setSubscription({
          status: data.company.subscription_status,
          days_left: data.company.days_left
        })
      }
    } catch { /* non-critical */ }
  }

  const copyCompanyCode = () => {
    if (companyCode) {
      navigator.clipboard.writeText(companyCode)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    }
  }

  const makeApiCall = async (endpoint) => {
    try {
      const response = await fetch(getApiUrl(endpoint), {
        headers: getAuthHeaders()
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
          navigate('/login')
          return null
        }

        if (errorData.code === 'SUBSCRIPTION_EXPIRED') {
          navigate('/client/subscription-expired')
          return null
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      logger.error('API call failed:', error)
      throw error
    }
  }

  const fetchDashboardData = async () => {
    // Skip API calls when offline
    if (!navigator.onLine) {
      setLoading(false)
      setRefreshing(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      logger.log(`📊 Fetching dashboard data for: ${
        isAllStoresView ? 'ALL STORES' : selectedStore?.name || 'NO STORE'
      }`)

      const [overviewData, recentSalesData, lowStockData, topProductsData, storesData] = await Promise.all([
        makeApiCall('/client/dashboard/overview'),
        makeApiCall('/client/dashboard/recent-sales'),
        makeApiCall('/client/dashboard/low-stock'),
        makeApiCall('/client/dashboard/top-products'),
        makeApiCall('/client/dashboard/stores')
      ])

      if (overviewData && recentSalesData && lowStockData && topProductsData && storesData) {
        setDashboardData({
          overview: overviewData.overview,
          recentSales: recentSalesData.recentSales,
          lowStockProducts: lowStockData.lowStockProducts,
          topProducts: topProductsData.topProducts,
          stores: storesData.stores
        })
      }

      logger.log('✅ Dashboard data loaded successfully')

    } catch (error) {
      logger.error('Failed to fetch dashboard data:', error)
      const isNetworkError = !navigator.onLine ||
        error.message === 'Failed to fetch' ||
        error.message?.includes('NetworkError') ||
        error.message?.includes('network')
      if (isNetworkError) {
        setNetworkDown(true)
      } else {
        setError(error.message)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchDashboardData()
  }

  // Dashboard title based on view mode
  const getDashboardTitle = () => {
    if (isAllStoresView) {
      return "All Stores Dashboard"
    } else if (selectedStore) {
      return `${selectedStore.name} Dashboard`
    } else {
      return "Store Dashboard"
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!navigator.onLine || networkDown) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-10">
            <div className="text-center max-w-md px-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <WifiOff className="h-8 w-8 text-orange-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">No connection</h2>
              <p className="text-gray-500 mb-6">Dashboard stats are not available offline.<br />You can still use the POS to make sales.</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate('/client/pos')} className="bg-[#E8302A] hover:bg-[#B91C1C]">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Go to POS
                </Button>
                <Button variant="outline" onClick={() => { setNetworkDown(false); handleRefresh() }}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} className="bg-[#E8302A] hover:bg-[#B91C1C]">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar userType="client" user={user} company={company} />
      <SidebarInset>
        {/* Header with Store Selector */}
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 overflow-hidden">
          <div className="flex items-center gap-2 px-4 shrink-0">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Store Selector in Header */}
          <div className="ml-auto px-4 flex items-center gap-2 min-w-0 overflow-hidden">
            <SimpleStoreSelector
              stores={stores}
              selectedStore={selectedStore}
              onStoreSelect={selectStore}
              viewMode={viewMode}
              onToggleViewMode={toggleViewMode}
              loading={false}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 pb-24">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                {isAllStoresView ? (
                  <Building2 className="h-6 w-6 text-blue-600" />
                ) : (
                  <StoreIcon className="h-6 w-6 text-blue-600" />
                )}
                {getDashboardTitle()}
              </h1>
              <p className="text-gray-600 mt-1">
                {isAllStoresView 
                  ? `Consolidated view across ${stores.length} stores`
                  : selectedStore 
                    ? `Viewing data for ${selectedStore.name}`
                    : "Select a store to view specific data"
                }
              </p>
            </div>
          </div>

          {/* Company Code Banner */}
          {companyCode && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600 font-medium">Staff Company Code</p>
                  <p className="text-lg font-mono font-bold tracking-widest text-blue-900">{companyCode}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-blue-500">Share this code with your staff to let them log in</p>
                <button
                  onClick={copyCompanyCode}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#E8302A] text-white text-xs rounded-md hover:bg-[#B91C1C]"
                >
                  {codeCopied ? <><Check className="h-3 w-3" /> Copied!</> : <><Copy className="h-3 w-3" /> Copy</>}
                </button>
              </div>
            </div>
          )}

          {/* Subscription Banner */}
          {subscription && (() => {
            const { status, days_left } = subscription
            const isExpired = status === 'expired' || (days_left !== null && days_left <= 0)
            const isUrgent = !isExpired && days_left !== null && days_left <= 7
            const isWarning = !isExpired && !isUrgent && days_left !== null && days_left <= 30

            if (status === 'active' && days_left !== null && days_left > 30) return null

            const bgClass = isExpired ? 'bg-red-50 border-red-300'
              : isUrgent ? 'bg-orange-50 border-orange-300'
              : isWarning ? 'bg-yellow-50 border-yellow-300'
              : 'bg-green-50 border-green-300'

            const textClass = isExpired ? 'text-red-800'
              : isUrgent ? 'text-orange-800'
              : isWarning ? 'text-yellow-800'
              : 'text-green-800'

            const Icon = isExpired ? AlertTriangle : isUrgent ? AlertTriangle : Clock

            const label = status === 'trial' ? 'Free Trial' : 'Subscription'
            const message = isExpired
              ? `Your ${label.toLowerCase()} has expired. Contact us to reactivate your account.`
              : days_left === 1
              ? `Your ${label.toLowerCase()} expires tomorrow!`
              : `Your ${label.toLowerCase()} expires in ${days_left} days.`

            return (
              <div className={`flex items-center justify-between border rounded-lg px-4 py-3 ${bgClass}`}>
                <div className={`flex items-center gap-3 ${textClass}`}>
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">
                      {isExpired ? `${label} Expired` : `${label} — ${days_left}d remaining`}
                    </p>
                    <p className="text-xs opacity-80">{message}</p>
                  </div>
                </div>
                {isExpired ? (
                  <button
                    onClick={() => navigate('/client/subscription-expired')}
                    className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 whitespace-nowrap"
                  >
                    Reactivate
                  </button>
                ) : isUrgent ? (
                  <div className={`flex items-center gap-1 text-xs font-medium ${textClass}`}>
                    <CreditCard className="h-4 w-4" />
                    <span>Contact us to subscribe</span>
                  </div>
                ) : null}
              </div>
            )
          })()}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: "Today's Sales",
                value: formatCurrency(dashboardData.overview.totalSales),
                sub: isAllStoresView ? 'All stores combined' : 'This store today',
                icon: DollarSign,
                gradient: 'from-[#E8302A] to-[#f97316]'
              },
              {
                label: 'Products',
                value: dashboardData.overview.totalProducts,
                sub: isAllStoresView ? 'Across all stores' : 'In this store',
                icon: Package,
                gradient: 'from-purple-500 to-purple-400'
              },
              {
                label: 'Staff',
                value: dashboardData.overview.totalStaff,
                sub: 'Active members',
                icon: Users,
                gradient: 'from-blue-500 to-cyan-400'
              },
              {
                label: 'Low Stock',
                value: dashboardData.overview.lowStockItems,
                sub: 'Need attention',
                icon: AlertCircle,
                gradient: 'from-emerald-500 to-teal-400'
              },
            ].map(({ label, value, sub, icon: Icon, gradient }) => (
              <div key={label} className={`bg-gradient-to-br ${gradient} rounded-2xl p-3.5 md:p-5 flex items-center justify-between gap-2 shadow-sm`}>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">{label}</p>
                  <p className="text-xl md:text-2xl font-bold text-white mt-0.5 truncate leading-tight">{value}</p>
                  <p className="text-[11px] text-white/70 mt-0.5 truncate">{sub}</p>
                </div>
                <Icon className="h-8 w-8 md:h-10 md:w-10 text-white/30 shrink-0" />
              </div>
            ))}
          </div>

          {/* Store Performance Grid (when viewing all stores) */}
          {isAllStoresView && stores.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Store Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stores.map((store) => (
                    <div 
                      key={store.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => selectStore(store)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{store.name}</h3>
                        <Badge
                          variant="secondary"
                          className={
                            store.status === 'active' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }
                        >
                          {store.status}
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold text-green-600 mb-1">
                        {formatCurrency(store.sales)}
                      </p>
                      <p className="text-xs text-gray-500">Today's sales</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Sales and Low Stock Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Sales */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Sales</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.recentSales.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.recentSales.map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatCurrency(sale.amount)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {sale.items} items • {sale.staff}
                          </p>
                          {isAllStoresView && sale.store && (
                            <p className="text-xs text-gray-500">{sale.store}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {formatDate(sale.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No recent sales</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Low Stock Products */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Low Stock Alert</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.lowStockProducts.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.lowStockProducts.slice(0, 5).map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-600">{product.category}</p>
                          {isAllStoresView && product.store && (
                            <p className="text-xs text-gray-500">{product.store}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant="destructive" className="bg-orange-100 text-orange-800">
                            {product.currentStock} left
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            Min: {product.minLevel}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">All products in stock</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

      </SidebarInset>
    </SidebarProvider>
  )
}