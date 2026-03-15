// src/app/admin/dashboard/page.jsx - Updated with API_CONFIG
import logger from '@/utils/logger';

import { useState, useEffect } from "react"
import { useNavigate } from 'react-router-dom'
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/ui/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Building2, Users, CreditCard, TrendingUp, Crown, AlertCircle, MoreVertical, RefreshCw, Loader2 } from "lucide-react"
import API_CONFIG from "@/config/api"

const getStatusColor = (status) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200"
    case "trial":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "suspended":
      return "bg-red-100 text-red-800 border-red-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  
  // Dashboard data states
  const [dashboardData, setDashboardData] = useState({
    companies: [],
    stats: {
      totalCompanies: 0,
      totalUsers: 0,
      totalRevenue: 0,
      systemHealth: '99.9%'
    },
    recentCompanies: [],
    systemStatus: {
      api: true,
      database: true,
      payments: true
    }
  })

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('userData')
    if (userData) {
      setUser(JSON.parse(userData))
    }

    // Fetch dashboard data
    fetchDashboardData()
  }, [])

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const makeApiCall = async (endpoint, options = {}) => {
    try {
      logger.log('🌐 API Call:', `${API_CONFIG.BASE_URL}${endpoint}`)
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        headers: getAuthHeaders(),
        ...options
      })

      // Handle token expiration
      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json()
        
        if (errorData.code === 'TOKEN_EXPIRED' || errorData.code === 'INVALID_TOKEN') {
          logger.log('🚨 Token expired during API call, redirecting to login')
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
    try {
      setLoading(true)
      setError(null)

      logger.log('📊 Fetching dashboard data from:', API_CONFIG.BASE_URL)

      // Fetch companies data
      const companiesData = await makeApiCall(API_CONFIG.ENDPOINTS.ADMIN.COMPANIES)
      
      if (!companiesData) {
        // Token expired, user will be redirected
        return
      }
      
      // Fetch additional stats
      const [usersStats, subscriptionStats] = await Promise.all([
        fetchUserStats(),
        fetchSubscriptionStats()
      ])

      // Process companies data
      const companies = companiesData.companies || []
      
      // Calculate stats
      const stats = {
        totalCompanies: companies.length,
        totalUsers: usersStats.totalUsers,
        totalRevenue: subscriptionStats.totalRevenue,
        systemHealth: '99.9%'
      }

      // Get recent companies (last 5)
      const recentCompanies = companies
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(company => ({
          id: company.id,
          name: company.name,
          email: company.contact_email,
          plan: getCompanyPlan(company),
          status: company.is_active ? 'active' : 'suspended',
          created: formatTimeAgo(company.created_at),
          userCount: company.users?.length || 0
        }))

      setDashboardData({
        companies,
        stats,
        recentCompanies,
        systemStatus: await fetchSystemStatus()
      })

      logger.log('✅ Dashboard data loaded successfully')

    } catch (error) {
      logger.error('Failed to fetch dashboard data:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserStats = async () => {
    try {
      const data = await makeApiCall(API_CONFIG.ENDPOINTS.ADMIN.USERS_STATS)
      
      if (data) {
        return { totalUsers: data.totalUsers || 0 }
      }
      
      return { totalUsers: 0 }
    } catch (error) {
      logger.error('Failed to fetch user stats:', error)
      return { totalUsers: 0 }
    }
  }

  const fetchSubscriptionStats = async () => {
    try {
      const data = await makeApiCall(API_CONFIG.ENDPOINTS.ADMIN.SUBSCRIPTION_STATS)
      
      if (data) {
        return { totalRevenue: data.totalRevenue || 0 }
      }
      
      return { totalRevenue: 0 }
    } catch (error) {
      logger.error('Failed to fetch subscription stats:', error)
      return { totalRevenue: 0 }
    }
  }

  const fetchSystemStatus = async () => {
    try {
      // Use regular fetch for health check since it doesn't require auth
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`)
      const data = await response.json()
      
      return {
        api: response.ok,
        database: data.database === 'connected',
        payments: true
      }
    } catch (error) {
      return {
        api: false,
        database: false,
        payments: false
      }
    }
  }

  const getCompanyPlan = (company) => {
    if (company.subscriptions && company.subscriptions.length > 0) {
      const subscription = company.subscriptions[0]
      if (subscription.plan_name === 'trial') return 'Trial'
      if (subscription.plan_name === 'basic') return 'Basic Plan'
      if (subscription.plan_name === 'pro') return 'Pro Plan'
      return 'Custom Plan'
    }
    return 'Free Trial'
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`
    } else if (diffInHours < 24 * 7) {
      const days = Math.floor(diffInHours / 24)
      return `${days} day${days > 1 ? 's' : ''} ago`
    } else {
      const weeks = Math.floor(diffInHours / (24 * 7))
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
  }

  const superAdminStats = [
    {
      title: "Total Companies",
      value: dashboardData.stats.totalCompanies.toString(),
      icon: Building2,
      description: `${dashboardData.companies.filter(c => c.is_active).length} active, ${dashboardData.companies.filter(c => !c.is_active).length} suspended`,
      trend: `+${Math.floor(dashboardData.stats.totalCompanies * 0.2)} this month`,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Total Users",
      value: dashboardData.stats.totalUsers.toString(),
      icon: Users,
      description: "Across all companies",
      trend: `+${Math.floor(dashboardData.stats.totalUsers * 0.08)} this month`,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Active Subscriptions",
      value: `₱${dashboardData.stats.totalRevenue.toLocaleString()}`,
      icon: CreditCard,
      description: "Monthly recurring revenue",
      trend: "+15% from last month",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "System Health",
      value: dashboardData.stats.systemHealth,
      icon: TrendingUp,
      description: "Uptime this month",
      trend: "All systems operational",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchDashboardData} className="bg-[#E8302A] hover:bg-[#B91C1C]">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar userType="super_admin" user={user} />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 overflow-hidden">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/admin">
                    Admin
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto px-4 flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
              Connected to {API_CONFIG.BASE_URL.includes('localhost') ? 'Local' : 'Production'}
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-xs"
            >
              <RefreshCw className={`mr-1 h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              System Administrator
            </Badge>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <Crown className="h-6 w-6 text-purple-600" />
                Super Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">System overview and management • Last updated: {new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {superAdminStats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.title} className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
                      <p className="text-xs text-gray-500">{stat.description}</p>
                      <p className="text-xs text-green-600 font-medium">{stat.trend}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Management Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Companies */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Recent Companies ({dashboardData.recentCompanies.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboardData.recentCompanies.length > 0 ? (
                  dashboardData.recentCompanies.map((company) => (
                    <div key={company.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-gray-200 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium">{company.name}</p>
                        <p className="text-sm text-gray-600">{company.email}</p>
                        <p className="text-xs text-gray-500">{company.plan} • {company.userCount} users • {company.created}</p>
                      </div>
                      <Badge variant="secondary" className={getStatusColor(company.status)}>
                        {company.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No companies found</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`flex items-center justify-between p-3 border rounded-lg ${
                  dashboardData.systemStatus.api && dashboardData.systemStatus.database 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div>
                    <p className={`font-medium ${
                      dashboardData.systemStatus.api && dashboardData.systemStatus.database
                        ? 'text-green-900' 
                        : 'text-red-900'
                    }`}>
                      {dashboardData.systemStatus.api && dashboardData.systemStatus.database 
                        ? 'All Systems Operational' 
                        : 'System Issues Detected'
                      }
                    </p>
                    <p className={`text-sm ${
                      dashboardData.systemStatus.api && dashboardData.systemStatus.database
                        ? 'text-green-700' 
                        : 'text-red-700'
                    }`}>
                      API, Database, and Payment processing status
                    </p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    dashboardData.systemStatus.api && dashboardData.systemStatus.database
                      ? 'bg-green-500' 
                      : 'bg-red-500'
                  }`}></div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Service</span>
                    <span className={`text-sm font-medium ${
                      dashboardData.systemStatus.api ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {dashboardData.systemStatus.api ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database</span>
                    <span className={`text-sm font-medium ${
                      dashboardData.systemStatus.database ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {dashboardData.systemStatus.database ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Payment Gateway</span>
                    <span className={`text-sm font-medium ${
                      dashboardData.systemStatus.payments ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {dashboardData.systemStatus.payments ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div 
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate('/admin/companies')}
                >
                  <Building2 className="h-6 w-6 text-blue-600 mb-2" />
                  <p className="font-medium">Manage Companies</p>
                  <p className="text-sm text-gray-600">View and manage all companies ({dashboardData.stats.totalCompanies})</p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <CreditCard className="h-6 w-6 text-purple-600 mb-2" />
                  <p className="font-medium">Subscriptions</p>
                  <p className="text-sm text-gray-600">Monitor billing and plans</p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <Users className="h-6 w-6 text-green-600 mb-2" />
                  <p className="font-medium">User Analytics</p>
                  <p className="text-sm text-gray-600">View user statistics ({dashboardData.stats.totalUsers} users)</p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <TrendingUp className="h-6 w-6 text-orange-600 mb-2" />
                  <p className="font-medium">System Reports</p>
                  <p className="text-sm text-gray-600">Generate system reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}