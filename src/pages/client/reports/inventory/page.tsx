// src/app/client/reports/inventory/page.jsx
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Package,
  TrendingUp,
  AlertTriangle,
  Download,
  Loader2,
  AlertCircle,
  DollarSign,
  BarChart3,
  Package2,
  Store
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import API_CONFIG from '@/config/api';
import { UserMenuDropdown } from '@/components/ui/UserMenuDropdown'
import { useStores } from '@/hooks/useStores';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function InventoryReportsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [inventorySummary, setInventorySummary] = useState(null);
  const [stockValue, setStockValue] = useState(null);
  const [turnoverRates, setTurnoverRates] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  const { stores, selectedStore, selectStore, fetchStores } = useStores();
  useEffect(() => { fetchStores(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAllReports();
    }
  }, [user, selectedStore]);

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

  const exportCSV = () => {
    const today = new Date().toISOString().split('T')[0]
    const rows: string[] = []

    const addSection = (title: string, headers: string[], data: string[][]) => {
      rows.push(title)
      rows.push(headers.map(h => `"${h}"`).join(','))
      data.forEach(row => rows.push(row.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')))
      rows.push('')
    }

    if (inventorySummary) {
      rows.push('INVENTORY SUMMARY')
      rows.push('"Metric","Value"')
      rows.push(`"Total Products","${inventorySummary.total_products}"`)
      rows.push(`"Total Units In Stock","${inventorySummary.total_stock_quantity}"`)
      rows.push(`"Stock Cost Value","₱${inventorySummary.total_stock_value?.toLocaleString() || 0}"`)
      rows.push(`"Stock Retail Value","₱${inventorySummary.total_retail_value?.toLocaleString() || 0}"`)
      rows.push(`"Low Stock Count","${inventorySummary.low_stock_count}"`)
      rows.push(`"Out of Stock Count","${inventorySummary.out_of_stock_count}"`)
      rows.push('')
    }

    if (stockValue?.categories?.length > 0) {
      addSection(
        'STOCK VALUE BY CATEGORY',
        ['Category', 'Products', 'Units', 'Cost Value (₱)', 'Retail Value (₱)', 'Margin %'],
        stockValue.categories.map(c => [c.category_name, c.total_products, c.total_quantity, c.cost_value, c.retail_value, c.profit_margin?.toFixed(2)])
      )
    }

    if (turnoverRates.length > 0) {
      addSection(
        'TOP TURNOVER RATES (Last 30 Days)',
        ['Product', 'Turnover Rate', 'Units Sold'],
        turnoverRates.map(t => [t.product_name, t.turnover_rate, t.quantity_sold])
      )
    }

    if (lowStockProducts.length > 0) {
      addSection(
        'LOW STOCK ALERTS',
        ['Product', 'SKU', 'Status', 'Stock Qty', 'Min Level', 'Reorder Qty', 'Stock Value (₱)'],
        lowStockProducts.map(p => [p.name, p.sku, p.stock_status, p.stock_quantity, p.min_stock_level, p.reorder_quantity, p.stock_value])
      )
    }

    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `inventory-report-${today}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const fetchAllReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');

      const storeParam = selectedStore ? `?store_id=${selectedStore.id}` : '';
      const storeParamAmp = selectedStore ? `&store_id=${selectedStore.id}` : '';
      const [summaryRes, valueRes, turnoverRes, lowStockRes] = await Promise.all([
        fetch(`${API_CONFIG.BASE_URL}/reports/inventory${storeParam}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_CONFIG.BASE_URL}/reports/inventory/stock-value${storeParam}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_CONFIG.BASE_URL}/reports/inventory/turnover?days=30${storeParamAmp}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_CONFIG.BASE_URL}/reports/inventory/low-stock${storeParam}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!summaryRes.ok || !valueRes.ok || !turnoverRes.ok || !lowStockRes.ok) {
        throw new Error('Failed to fetch reports');
      }

      const [summaryData, valueData, turnoverData, lowStockData] = await Promise.all([
        summaryRes.json(),
        valueRes.json(),
        turnoverRes.json(),
        lowStockRes.json()
      ]);

      setInventorySummary(summaryData.summary);
      setStockValue(valueData);
      setTurnoverRates(turnoverData.products.slice(0, 10));
      setLowStockProducts(lowStockData.products);

    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load inventory reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !inventorySummary) {
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
                  <BreadcrumbPage>Inventory Reports</BreadcrumbPage>
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

          {/* Page Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="hidden md:block">
              <h1 className="text-3xl font-bold tracking-tight">Inventory Reports</h1>
              <p className="text-muted-foreground mt-1">Stock levels, valuations, and movement analysis</p>
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
              <Button variant="outline" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          {inventorySummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-3.5 md:p-5 flex items-center justify-between gap-2 shadow-sm">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">Total Products</p>
                  <p className="text-xl md:text-2xl font-bold text-white mt-0.5 truncate leading-tight">{inventorySummary.total_products}</p>
                  <p className="text-[11px] text-white/70 mt-0.5 truncate">{inventorySummary.total_stock_quantity} units in stock</p>
                </div>
                <Package className="h-8 w-8 md:h-10 md:w-10 text-white/30 shrink-0" />
              </div>

              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-3.5 md:p-5 flex items-center justify-between gap-2 shadow-sm">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">Stock Value</p>
                  <p className="text-xl md:text-2xl font-bold text-white mt-0.5 truncate leading-tight">₱{inventorySummary.total_stock_value?.toLocaleString() || 0}</p>
                  <p className="text-[11px] text-white/70 mt-0.5 truncate">Retail: ₱{inventorySummary.total_retail_value?.toLocaleString() || 0}</p>
                </div>
                <DollarSign className="h-8 w-8 md:h-10 md:w-10 text-white/30 shrink-0" />
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-3.5 md:p-5 flex items-center justify-between gap-2 shadow-sm">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">Low Stock</p>
                  <p className="text-xl md:text-2xl font-bold text-white mt-0.5 truncate leading-tight">{inventorySummary.low_stock_count}</p>
                  <p className="text-[11px] text-white/70 mt-0.5 truncate">Need reordering soon</p>
                </div>
                <AlertTriangle className="h-8 w-8 md:h-10 md:w-10 text-white/30 shrink-0" />
              </div>

              <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-3.5 md:p-5 flex items-center justify-between gap-2 shadow-sm">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">Out of Stock</p>
                  <p className="text-xl md:text-2xl font-bold text-white mt-0.5 truncate leading-tight">{inventorySummary.out_of_stock_count}</p>
                  <p className="text-[11px] text-white/70 mt-0.5 truncate">Immediate action required</p>
                </div>
                <Package2 className="h-8 w-8 md:h-10 md:w-10 text-white/30 shrink-0" />
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="valuation" className="space-y-4">
            <TabsList>
              <TabsTrigger value="valuation">Stock Valuation</TabsTrigger>
              <TabsTrigger value="turnover">Turnover Rates</TabsTrigger>
              <TabsTrigger value="alerts">Low Stock Alerts</TabsTrigger>
            </TabsList>

            {/* Valuation Tab */}
            <TabsContent value="valuation" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Stock Value by Category</CardTitle>
                    <CardDescription>Distribution of inventory worth</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stockValue?.categories || []}
                          dataKey="retail_value"
                          nameKey="category_name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={(entry: any) => entry.category_name}
                        >
                          {(stockValue?.categories || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Category Breakdown</CardTitle>
                    <CardDescription>Detailed valuation by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stockValue?.categories?.map((cat, index) => (
                        <div key={cat.category_id} className="flex items-center gap-4">
                          <div 
                            className="w-4 h-4 rounded" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <div className="flex-1">
                            <p className="font-medium">{cat.category_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {cat.total_products} products, {cat.total_quantity} units
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">₱{cat.retail_value.toLocaleString()}</p>
                            <p className="text-sm text-green-600">
                              {cat.profit_margin.toFixed(1)}% margin
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Turnover Tab */}
            <TabsContent value="turnover" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Products by Turnover Rate</CardTitle>
                  <CardDescription>Fastest moving inventory items (Last 30 days)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={turnoverRates} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="product_name" type="category" width={150} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="turnover_rate" fill="#3b82f6" name="Turnover Rate" />
                      <Bar dataKey="quantity_sold" fill="#10b981" name="Units Sold" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Low Stock Tab */}
            <TabsContent value="alerts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Low Stock Alerts</CardTitle>
                  <CardDescription>Products requiring attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lowStockProducts.length === 0 ? (
                      <Alert>
                        <TrendingUp className="h-4 w-4" />
                        <AlertDescription>
                          All products are adequately stocked! Great job managing inventory.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      lowStockProducts.map((product) => (
                        <div 
                          key={product.id} 
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{product.name}</p>
                              <Badge variant={product.stock_status === 'out_of_stock' ? 'destructive' : 'secondary'}>
                                {product.stock_status === 'out_of_stock' ? 'OUT OF STOCK' : 'LOW STOCK'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{product.sku}</p>
                          </div>
                          <div className="text-center px-4">
                            <p className="text-2xl font-bold text-orange-600">
                              {product.stock_quantity}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Min: {product.min_stock_level}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-blue-600">
                              Reorder: {product.reorder_quantity} units
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Value: ₱{product.stock_value.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}