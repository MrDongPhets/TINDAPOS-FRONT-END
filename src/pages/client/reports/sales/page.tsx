// src/app/client/reports/sales/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Download,
  Loader2,
  AlertCircle,
  Calendar,
  TrendingDown,
  Package
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import API_CONFIG from '@/config/api';
import { UserMenuDropdown } from '@/components/ui/UserMenuDropdown'
import { useStores } from '@/hooks/useStores';
import { Store } from 'lucide-react';

export default function SalesReportsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [salesSummary, setSalesSummary] = useState(null);
  const [periodData, setPeriodData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [staffPerformance, setStaffPerformance] = useState([]);
  
  // Filter states
  const [period, setPeriod] = useState('daily');
  const [dateRange, setDateRange] = useState('today');

  const { stores, selectedStore, selectStore, fetchStores } = useStores();
  useEffect(() => { fetchStores(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAllReports();
    }
  }, [user, period, dateRange, selectedStore]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Authentication failed');

      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      console.error('Auth error:', err);
      localStorage.removeItem('authToken');
      navigate('/login');
    }
  };

  const getDateRange = () => {
    const now = new Date();
    let start, end;

    switch (dateRange) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'week':
        start = new Date(now.setDate(now.getDate() - 7));
        end = new Date();
        break;
      case 'month':
        start = new Date(now.setDate(now.getDate() - 30));
        end = new Date();
        break;
      case 'year':
        start = new Date(now.setFullYear(now.getFullYear() - 1));
        end = new Date();
        break;
      default:
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
    }

    return {
      start_date: start.toISOString(),
      end_date: end.toISOString()
    };
  };

  const exportCSV = () => {
    const today = new Date().toISOString().split('T')[0]
    const rows: string[] = []

    const addSection = (title: string, headers: string[], data: string[][]) => {
      rows.push(title)
      rows.push(headers.map(h => `"${h}"`).join(','))
      data.forEach(row => rows.push(row.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')))
      rows.push('')
    }

    if (salesSummary) {
      rows.push('SALES SUMMARY')
      rows.push('"Metric","Value"')
      rows.push(`"Total Sales","₱${salesSummary.total_sales?.toLocaleString() || 0}"`)
      rows.push(`"Total Transactions","${salesSummary.total_transactions}"`)
      rows.push(`"Avg Transaction","₱${salesSummary.average_transaction?.toFixed(2) || 0}"`)
      rows.push(`"Total Items Sold","${salesSummary.total_items}"`)
      rows.push(`"Total Discount","₱${salesSummary.total_discount?.toLocaleString() || 0}"`)
      rows.push(`"Total Tax","₱${salesSummary.total_tax?.toLocaleString() || 0}"`)
      rows.push('')
    }

    if (topProducts.length > 0) {
      addSection(
        'TOP PRODUCTS',
        ['Rank', 'Product', 'SKU', 'Total Sales (₱)', 'Qty Sold'],
        topProducts.map((p, i) => [i + 1, p.product_name, p.product_sku, p.total_sales, p.total_quantity])
      )
    }

    if (staffPerformance.length > 0) {
      addSection(
        'STAFF PERFORMANCE',
        ['Staff', 'Total Sales (₱)', 'Transactions', 'Avg Sale (₱)'],
        staffPerformance.map(s => [s.staff_name, s.total_sales, s.total_transactions, s.average_transaction?.toFixed(2)])
      )
    }

    if (periodData.length > 0) {
      addSection(
        `SALES TREND (${period})`,
        ['Period', 'Total Sales (₱)', 'Transactions'],
        periodData.map(d => [d.period, d.total_sales, d.total_transactions])
      )
    }

    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `sales-report-${today}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const fetchAllReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      const { start_date, end_date } = getDateRange();

      const storeParam = selectedStore ? `&store_id=${selectedStore.id}` : '';
      const [summaryRes, periodRes, topProductsRes, staffRes] = await Promise.all([
        fetch(`${API_CONFIG.BASE_URL}/reports/sales?start_date=${start_date}&end_date=${end_date}${storeParam}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_CONFIG.BASE_URL}/reports/sales/period?period=${period}&start_date=${start_date}&end_date=${end_date}${storeParam}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_CONFIG.BASE_URL}/reports/sales/top-products?limit=10&start_date=${start_date}&end_date=${end_date}${storeParam}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_CONFIG.BASE_URL}/reports/sales/staff-performance?start_date=${start_date}&end_date=${end_date}${storeParam}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!summaryRes.ok || !periodRes.ok || !topProductsRes.ok || !staffRes.ok) {
        throw new Error('Failed to fetch reports');
      }

      const [summaryData, periodData, topProductsData, staffData] = await Promise.all([
        summaryRes.json(),
        periodRes.json(),
        topProductsRes.json(),
        staffRes.json()
      ]);

      setSalesSummary(summaryData.summary);
      setPeriodData(periodData.data);
      setTopProducts(topProductsData.products);
      setStaffPerformance(staffData.performance);

    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load sales reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !salesSummary) {
    return (
      <SidebarProvider>
        <AppSidebar userType="client" user={user} />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/client/reports">Reports</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Sales Reports</BreadcrumbPage>
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

          {/* Page Header with Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="hidden md:block">
              <h1 className="text-3xl font-bold tracking-tight">Sales Reports</h1>
              <p className="text-muted-foreground mt-1">Comprehensive sales analytics and performance metrics</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {stores.length > 1 && (
                <Select value={selectedStore?.id ?? 'all'} onValueChange={(v) => {
                  if (v === 'all') selectStore(null as any)
                  else { const s = stores.find(x => x.id === v); if (s) selectStore(s) }
                }}>
                  <SelectTrigger className="w-[150px]">
                    <Store className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Stores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stores</SelectItem>
                    {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}

              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[150px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>

              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          {salesSummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-3.5 md:p-5 flex items-center justify-between gap-2 shadow-sm">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">Total Sales</p>
                  <p className="text-xl md:text-2xl font-bold text-white mt-0.5 truncate leading-tight">₱{salesSummary.total_sales?.toLocaleString() || 0}</p>
                  <p className="text-[11px] text-white/70 mt-0.5 truncate">{salesSummary.total_transactions} transactions</p>
                </div>
                <DollarSign className="h-8 w-8 md:h-10 md:w-10 text-white/30 shrink-0" />
              </div>

              <div className="bg-gradient-to-br from-[#E8302A] to-[#f97316] rounded-2xl p-3.5 md:p-5 flex items-center justify-between gap-2 shadow-sm">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">Avg Transaction</p>
                  <p className="text-xl md:text-2xl font-bold text-white mt-0.5 truncate leading-tight">₱{salesSummary.average_transaction?.toFixed(2) || 0}</p>
                  <p className="text-[11px] text-white/70 mt-0.5 truncate">{salesSummary.total_items} items sold</p>
                </div>
                <ShoppingCart className="h-8 w-8 md:h-10 md:w-10 text-white/30 shrink-0" />
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-3.5 md:p-5 flex items-center justify-between gap-2 shadow-sm">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">Total Discount</p>
                  <p className="text-xl md:text-2xl font-bold text-white mt-0.5 truncate leading-tight">₱{salesSummary.total_discount?.toLocaleString() || 0}</p>
                  <p className="text-[11px] text-white/70 mt-0.5 truncate">Tax: ₱{salesSummary.total_tax?.toLocaleString() || 0}</p>
                </div>
                <TrendingDown className="h-8 w-8 md:h-10 md:w-10 text-white/30 shrink-0" />
              </div>

              <div className="bg-gradient-to-br from-[#E8302A] to-[#f97316] rounded-2xl p-3.5 md:p-5 flex items-center justify-between gap-2 shadow-sm">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">Items/Transaction</p>
                  <p className="text-xl md:text-2xl font-bold text-white mt-0.5 truncate leading-tight">
                    {salesSummary.total_transactions > 0
                      ? (salesSummary.total_items / salesSummary.total_transactions).toFixed(1)
                      : 0}
                  </p>
                  <p className="text-[11px] text-white/70 mt-0.5 truncate">Average basket size</p>
                </div>
                <Package className="h-8 w-8 md:h-10 md:w-10 text-white/30 shrink-0" />
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="products">Top Products</TabsTrigger>
              <TabsTrigger value="staff">Staff Performance</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-gray-700">Sales Trend</CardTitle>
                  <CardDescription>{period.charAt(0).toUpperCase() + period.slice(1)} performance</CardDescription>
                </CardHeader>
                <CardContent className="p-0 pb-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={periodData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="salesTrendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#E8302A" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#E8302A" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="txnGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', background: '#fff' }}
                        formatter={(v: any, name: string) => [name === 'total_sales' ? `₱${v.toLocaleString()}` : v, name === 'total_sales' ? 'Sales' : 'Transactions']}
                      />
                      <Area type="monotone" dataKey="total_sales" stroke="#E8302A" strokeWidth={2.5} fill="url(#salesTrendGrad)" dot={{ r: 3, fill: '#E8302A', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#fff', stroke: '#E8302A', strokeWidth: 2 }} />
                      <Area type="monotone" dataKey="total_transactions" stroke="#f97316" strokeWidth={2} fill="url(#txnGrad)" dot={{ r: 3, fill: '#f97316', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#fff', stroke: '#f97316', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Top Products Tab */}
            <TabsContent value="products" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Products</CardTitle>
                  <CardDescription>Best performing items by quantity sold</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topProducts.map((product, index) => (
                      <div key={product.product_id} className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{product.product_name}</p>
                          <p className="text-sm text-muted-foreground">{product.product_sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">₱{product.total_sales.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">{product.total_quantity} sold</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Staff Performance Tab */}
            <TabsContent value="staff" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Staff Performance</CardTitle>
                  <CardDescription>Individual sales achievements</CardDescription>
                </CardHeader>
                <CardContent className="p-0 pb-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={staffPerformance} margin={{ top: 10, right: 16, left: 0, bottom: 40 }}>
                      <defs>
                        <linearGradient id="staffSalesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#E8302A" />
                          <stop offset="100%" stopColor="#E8302A" />
                        </linearGradient>
                        <linearGradient id="staffTxnGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" />
                          <stop offset="100%" stopColor="#ea580c" />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="staff_name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" height={60} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', background: '#fff' }}
                        formatter={(v: any, name: string) => [name === 'total_sales' ? `₱${v.toLocaleString()}` : v, name === 'total_sales' ? 'Sales' : 'Transactions']}
                      />
                      <Bar dataKey="total_sales" fill="url(#staffSalesGrad)" radius={[4, 4, 0, 0]} barSize={18} name="total_sales" />
                      <Bar dataKey="total_transactions" fill="url(#staffTxnGrad)" radius={[4, 4, 0, 0]} barSize={18} name="total_transactions" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}