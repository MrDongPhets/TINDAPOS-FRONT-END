// src/app/client/reports/financial/page.jsx
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
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  Loader2,
  AlertCircle,
  Percent,
  Receipt,
  Store,
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import API_CONFIG from '@/config/api';
import { useStores } from '@/hooks/useStores';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function FinancialReportsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [financialSummary, setFinancialSummary] = useState(null);
  const [profitMargins, setProfitMargins] = useState([]);
  const [revenueByStore, setRevenueByStore] = useState(null);
  const [taxReports, setTaxReports] = useState(null);
  
  // Filter states
  const [dateRange, setDateRange] = useState('month');
  const [groupBy, setGroupBy] = useState('category');

  const { stores, selectedStore, selectStore, fetchStores } = useStores();
  useEffect(() => { fetchStores(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAllReports();
    }
  }, [user, dateRange, groupBy, selectedStore]);

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
      case 'week':
        start = new Date(now.setDate(now.getDate() - 7));
        end = new Date();
        break;
      case 'month':
        start = new Date(now.setDate(now.getDate() - 30));
        end = new Date();
        break;
      case 'quarter':
        start = new Date(now.setDate(now.getDate() - 90));
        end = new Date();
        break;
      case 'year':
        start = new Date(now.setFullYear(now.getFullYear() - 1));
        end = new Date();
        break;
      default:
        start = new Date(now.setDate(now.getDate() - 30));
        end = new Date();
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

    if (profitMargins.length > 0) {
      addSection(
        `PROFIT MARGINS (${dateRange})`,
        ['Name', 'Revenue (₱)', 'COGS (₱)', 'Gross Profit (₱)', 'Net Profit (₱)', 'Gross Margin %'],
        profitMargins.map(i => [i.name, i.total_revenue, i.total_cogs, i.gross_profit, i.net_profit, i.gross_margin?.toFixed(2)])
      )
    }

    if (revenueByStore?.stores?.length > 0) {
      addSection(
        'REVENUE BY STORE',
        ['Store', 'Address', 'Revenue (₱)', 'Transactions', 'Avg Sale (₱)'],
        revenueByStore.stores.map(s => [s.store_name, s.store_address, s.total_revenue, s.transaction_count, s.average_transaction?.toFixed(2)])
      )
    }

    if (taxReports?.data?.length > 0) {
      addSection(
        'TAX SUMMARY',
        ['Period', 'Total Sales (₱)', 'Tax Collected (₱)'],
        taxReports.data.map(t => [t.period, t.total_sales, t.total_tax])
      )
    }

    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `financial-report-${today}.csv`
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
      const [summaryRes, marginsRes, revenueRes, taxRes] = await Promise.all([
        fetch(`${API_CONFIG.BASE_URL}/reports/financial?start_date=${start_date}&end_date=${end_date}${storeParam}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_CONFIG.BASE_URL}/reports/financial/profit-margins?group_by=${groupBy}&start_date=${start_date}&end_date=${end_date}${storeParam}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_CONFIG.BASE_URL}/reports/financial/revenue-by-store?start_date=${start_date}&end_date=${end_date}${storeParam}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_CONFIG.BASE_URL}/reports/financial/tax?group_by=monthly&start_date=${start_date}&end_date=${end_date}${storeParam}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!summaryRes.ok || !marginsRes.ok || !revenueRes.ok || !taxRes.ok) {
        throw new Error('Failed to fetch reports');
      }

      const [summaryData, marginsData, revenueData, taxData] = await Promise.all([
        summaryRes.json(),
        marginsRes.json(),
        revenueRes.json(),
        taxRes.json()
      ]);

      setFinancialSummary(summaryData.summary);
      setProfitMargins(marginsData.items);
      setRevenueByStore(revenueData);
      setTaxReports(taxData);

    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load financial reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !financialSummary) {
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
                  <BreadcrumbPage>Financial Reports</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
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
              <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
              <p className="text-muted-foreground mt-1">Revenue, profitability, and tax analytics</p>
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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          {financialSummary && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-3.5 md:p-5 flex items-center justify-between gap-2 shadow-sm">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">Total Revenue</p>
                  <p className="text-xl md:text-2xl font-bold text-white mt-0.5 truncate leading-tight">₱{financialSummary.gross_profit?.toLocaleString() || 0}</p>
                  <p className="text-[11px] text-white/70 mt-0.5 truncate">{financialSummary.gross_margin?.toFixed(1)}% margin</p>
                </div>
                <DollarSign className="h-8 w-8 md:h-10 md:w-10 text-white/30 shrink-0" />
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-3.5 md:p-5 flex items-center justify-between gap-2 shadow-sm">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">Net Profit</p>
                  <p className="text-xl md:text-2xl font-bold text-white mt-0.5 truncate leading-tight">₱{financialSummary.net_profit?.toLocaleString() || 0}</p>
                  <p className="text-[11px] text-white/70 mt-0.5 truncate">{financialSummary.net_margin?.toFixed(1)}% margin</p>
                </div>
                <Percent className="h-8 w-8 md:h-10 md:w-10 text-white/30 shrink-0" />
              </div>

              <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-3.5 md:p-5 flex items-center justify-between gap-2 shadow-sm">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">Tax Collected</p>
                  <p className="text-xl md:text-2xl font-bold text-white mt-0.5 truncate leading-tight">₱{financialSummary.total_tax?.toLocaleString() || 0}</p>
                  <p className="text-[11px] text-white/70 mt-0.5 truncate">COGS: ₱{financialSummary.total_cogs?.toLocaleString() || 0}</p>
                </div>
                <Receipt className="h-8 w-8 md:h-10 md:w-10 text-white/30 shrink-0" />
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="margins" className="space-y-4">
            <TabsList>
              <TabsTrigger value="margins">Profit Margins</TabsTrigger>
              <TabsTrigger value="stores">Revenue by Store</TabsTrigger>
              <TabsTrigger value="tax">Tax Reports</TabsTrigger>
            </TabsList>

            {/* Profit Margins Tab */}
            <TabsContent value="margins" className="space-y-4">
              <div className="flex justify-end mb-4">
                <Select value={groupBy} onValueChange={setGroupBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Group by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">By Product</SelectItem>
                    <SelectItem value="category">By Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Gross Profit Margin</CardTitle>
                    <CardDescription>
                      Profitability by {groupBy}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={profitMargins.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
                        <Legend />
                        <Bar dataKey="gross_profit" fill="#3b82f6" name="Gross Profit" />
                        <Bar dataKey="net_profit" fill="#10b981" name="Net Profit" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Performers</CardTitle>
                    <CardDescription>Highest profit margins</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {profitMargins.slice(0, 8).map((item, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium truncate">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Revenue: ₱{item.total_revenue.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${item.gross_margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.gross_margin >= 0 ? '' : ''}{item.gross_margin.toFixed(1)}%
                            </p>
                            <p className={`text-sm ${item.gross_profit >= 0 ? 'text-muted-foreground' : 'text-red-500'}`}>
                              ₱{item.gross_profit.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue vs Cost Analysis</CardTitle>
                  <CardDescription>Detailed financial breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={profitMargins.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="total_revenue" fill="#3b82f6" name="Revenue" />
                      <Bar dataKey="total_cogs" fill="#ef4444" name="COGS" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Revenue by Store Tab */}
            <TabsContent value="stores" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Store Performance Comparison</CardTitle>
                    <CardDescription>Revenue by location</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={revenueByStore?.stores || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="store_name" />
                        <YAxis />
                        <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
                        <Legend />
                        <Bar dataKey="total_revenue" fill="#3b82f6" name="Revenue" />
                        <Bar dataKey="transaction_count" fill="#10b981" name="Transactions" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Distribution</CardTitle>
                    <CardDescription>Store contribution percentage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={revenueByStore?.stores || []}
                          dataKey="total_revenue"
                          nameKey="store_name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={(entry: any) => entry.store_name}
                        >
                          {(revenueByStore?.stores || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Store Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Store Details</CardTitle>
                  <CardDescription>Comprehensive store metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {revenueByStore?.stores?.map((store) => (
                      <div key={store.store_id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-100 shrink-0">
                            <Store className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{store.store_name}</p>
                            <p className="text-sm text-muted-foreground truncate">{store.store_address}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-lg font-bold">₱{store.total_revenue.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Revenue</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold">{store.transaction_count}</p>
                            <p className="text-xs text-muted-foreground">Transactions</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold">₱{store.average_transaction.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Avg Sale</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Company Totals */}
                  {revenueByStore?.company_totals && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-3">Company Totals</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-blue-600">
                            ₱{revenueByStore.company_totals.total_revenue.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Total Revenue</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">
                            {revenueByStore.company_totals.total_stores}
                          </p>
                          <p className="text-xs text-muted-foreground">Active Stores</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-purple-600">
                            {revenueByStore.company_totals.total_transactions}
                          </p>
                          <p className="text-xs text-muted-foreground">Total Transactions</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-orange-600">
                            ₱{revenueByStore.company_totals.average_revenue_per_store.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Avg per Store</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tax Reports Tab */}
            <TabsContent value="tax" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tax Collection Summary</CardTitle>
                  <CardDescription>Monthly tax reporting</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Sales</p>
                      <p className="text-2xl font-bold">
                        ₱{taxReports?.summary?.total_sales?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Tax Collected</p>
                      <p className="text-2xl font-bold text-green-600">
                        ₱{taxReports?.summary?.total_tax_collected?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Effective Tax Rate</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {taxReports?.summary?.effective_tax_rate?.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={taxReports?.data || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="total_sales" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Total Sales"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="total_tax" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Tax Collected"
                      />
                    </LineChart>
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
