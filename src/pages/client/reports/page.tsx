// src/app/client/reports/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  Package,
  DollarSign,
  ShoppingCart,
  BarChart3,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  Store,
} from 'lucide-react';
import API_CONFIG from '@/config/api';
import { UserMenuDropdown } from '@/components/ui/UserMenuDropdown'

export default function ReportsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quickStats, setQuickStats] = useState(null);

  useEffect(() => {
    checkAuth();
    fetchQuickStats();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      console.error('Auth error:', err);
      localStorage.removeItem('authToken');
      navigate('/login');
    }
  };

  const fetchQuickStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      // Fetch quick stats from different endpoints
      const [salesRes, inventoryRes] = await Promise.all([
        fetch(`${API_CONFIG.BASE_URL}/reports/sales?start_date=${startOfDay}&end_date=${endOfDay}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_CONFIG.BASE_URL}/reports/inventory`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!salesRes.ok || !inventoryRes.ok) {
        throw new Error('Failed to fetch stats');
      }

      const salesData = await salesRes.json();
      const inventoryData = await inventoryRes.json();

      setQuickStats({
        todaySales: salesData.summary.total_sales || 0,
        todayTransactions: salesData.summary.total_transactions || 0,
        totalProducts: inventoryData.summary.total_products || 0,
        lowStock: inventoryData.summary.low_stock_count || 0
      });

    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const reportCategories = [
    {
      title: 'Sales Reports',
      description: 'Track sales performance, trends, and staff analytics',
      icon: ShoppingCart,
      color: 'blue',
      href: '/client/reports/sales',
      reports: [
        { name: 'Sales Summary', desc: 'Overall sales metrics' },
        { name: 'Sales by Period', desc: 'Daily, weekly, monthly analysis' },
        { name: 'Top Products', desc: 'Best selling items' },
        { name: 'Staff Performance', desc: 'Individual sales tracking' }
      ]
    },
    {
      title: 'Inventory Reports',
      description: 'Monitor stock levels, movements, and valuations',
      icon: Package,
      color: 'green',
      href: '/client/reports/inventory',
      reports: [
        { name: 'Stock Summary', desc: 'Current inventory levels' },
        { name: 'Stock Valuation', desc: 'Inventory worth analysis' },
        { name: 'Turnover Rates', desc: 'Product movement speed' },
        { name: 'Low Stock Alerts', desc: 'Reorder notifications' }
      ]
    },
    {
      title: 'Financial Reports',
      description: 'Analyze revenue, profits, and financial health',
      icon: DollarSign,
      color: 'purple',
      href: '/client/reports/financial',
      reports: [
        { name: 'Financial Summary', desc: 'Revenue and profit overview' },
        { name: 'Profit Margins', desc: 'Profitability by product/category' },
        { name: 'Expense Tracking', desc: 'Cost analysis' },
        { name: 'Tax Reports', desc: 'Tax collection summary' }
      ]
    }
  ];

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar userType="client" user={user} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 px-4">
            <div className="h-5 w-5 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-28 rounded bg-gray-200 animate-pulse ml-2" />
            <div className="ml-auto h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
          </header>
          <div className="flex flex-col gap-4 p-4 pt-0">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => <div key={i} className="rounded-2xl bg-gray-200 animate-pulse h-24" />)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-xl border bg-white p-4 animate-pulse space-y-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-lg" />
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-full bg-gray-100 rounded" />
                  <div className="space-y-2 pt-2">
                    {[...Array(4)].map((_, j) => <div key={j} className="h-3 bg-gray-100 rounded w-3/4" />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar userType="client" user={user} />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 overflow-hidden">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/client">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Reports & Analytics</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto pr-4"><UserMenuDropdown /></div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 pb-24">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Page Title */}
          <div className="hidden md:block">
            <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Comprehensive business insights and data analysis</p>
          </div>

          {/* Quick Stats */}
          {quickStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-3.5 md:p-5 flex items-center justify-between gap-2 shadow-sm">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">Today's Sales</p>
                  <p className="text-xl md:text-2xl font-bold text-white mt-0.5 truncate leading-tight">₱{quickStats.todaySales.toLocaleString()}</p>
                  <p className="text-[11px] text-white/70 mt-0.5 truncate">{quickStats.todayTransactions} transactions</p>
                </div>
                <TrendingUp className="h-8 w-8 md:h-10 md:w-10 text-white/30 shrink-0" />
              </div>

              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-3.5 md:p-5 flex items-center justify-between gap-2 shadow-sm">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">Total Products</p>
                  <p className="text-xl md:text-2xl font-bold text-white mt-0.5 truncate leading-tight">{quickStats.totalProducts}</p>
                  <p className="text-[11px] text-white/70 mt-0.5 truncate">Active in inventory</p>
                </div>
                <Package className="h-8 w-8 md:h-10 md:w-10 text-white/30 shrink-0" />
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-3.5 md:p-5 flex items-center justify-between gap-2 shadow-sm">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">Low Stock Items</p>
                  <p className="text-xl md:text-2xl font-bold text-white mt-0.5 truncate leading-tight">{quickStats.lowStock}</p>
                  <p className="text-[11px] text-white/70 mt-0.5 truncate">Need reordering</p>
                </div>
                <AlertCircle className="h-8 w-8 md:h-10 md:w-10 text-white/30 shrink-0" />
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-3.5 md:p-5 flex items-center justify-between gap-2 shadow-sm">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">Active Stores</p>
                  <p className="text-xl md:text-2xl font-bold text-white mt-0.5 truncate leading-tight">{user?.company?.name || 'N/A'}</p>
                  <p className="text-[11px] text-white/70 mt-0.5 truncate">Multi-store ready</p>
                </div>
                <Store className="h-8 w-8 md:h-10 md:w-10 text-white/30 shrink-0" />
              </div>
            </div>
          )}

          {/* Report Categories */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reportCategories.map((category) => {
              const Icon = category.icon;
              const colorClasses = {
                blue: 'bg-blue-100 text-blue-600',
                green: 'bg-green-100 text-green-600',
                purple: 'bg-purple-100 text-purple-600'
              };

              return (
                <Link key={category.title} to={category.href}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className={`p-3 rounded-lg ${colorClasses[category.color]}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <CardTitle className="mt-4">{category.title}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {category.reports.map((report) => (
                          <li key={report.name} className="flex items-start gap-2">
                            <BarChart3 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{report.name}</p>
                              <p className="text-xs text-muted-foreground">{report.desc}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}