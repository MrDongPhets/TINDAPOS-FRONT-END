import { formatCurrency } from '@/lib/utils'
// src/app/client/sales/page.jsx
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
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  SlidersHorizontal,
  Download,
  Eye,
  Loader2,
  AlertCircle,
  Calendar,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Receipt,
  Store,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import API_CONFIG from '@/config/api';
import { UserMenuDropdown } from '@/components/ui/UserMenuDropdown'

export default function SalesPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState(null);
  const [stores, setStores] = useState([]);
  const [staff, setStaff] = useState([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState('all');
  const [dateRange, setDateRange] = useState('today');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchInitialData();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchSales();
      fetchSummary();
    }
  }, [user, page, selectedStore, selectedStaff, selectedPayment, dateRange]);

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
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        start = new Date(yesterday.setHours(0, 0, 0, 0));
        end = new Date(yesterday.setHours(23, 59, 59, 999));
        break;
      case 'week':
        start = new Date(now.setDate(now.getDate() - 7));
        end = new Date();
        break;
      case 'month':
        start = new Date(now.setDate(now.getDate() - 30));
        end = new Date();
        break;
      case 'all':
        return {};
      default:
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
    }

    return {
      start_date: start.toISOString(),
      end_date: end.toISOString()
    };
  };

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('authToken');

      // Fetch stores and staff for filters
      const [storesRes, staffRes] = await Promise.all([
        fetch(`${API_CONFIG.BASE_URL}/client/stores`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_CONFIG.BASE_URL}/client/staff`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (storesRes.ok) {
        const storesData = await storesRes.json();
        setStores(storesData.stores || []);
      }

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaff(staffData.staff || []);
      }

    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');

      const { start_date, end_date } = getDateRange();
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      if (selectedStore !== 'all') params.append('store_id', selectedStore);
      if (selectedStaff !== 'all') params.append('staff_id', selectedStaff);
      if (selectedPayment !== 'all') params.append('payment_method', selectedPayment);
      if (start_date) params.append('start_date', start_date);
      if (end_date) params.append('end_date', end_date);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`${API_CONFIG.BASE_URL}/client/sales?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch sales');

      const data = await response.json();
      setSales(data.sales || []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.count || 0);

    } catch (err) {
      console.error('Error fetching sales:', err);
      setError('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const { start_date, end_date } = getDateRange();

      const params = new URLSearchParams();
      if (start_date) params.append('start_date', start_date);
      if (end_date) params.append('end_date', end_date);
      if (selectedStore !== 'all') params.append('store_id', selectedStore);

      const response = await fetch(`${API_CONFIG.BASE_URL}/client/sales/summary?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchSales();
  };

  const exportToCSV = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const { start_date, end_date } = getDateRange();
      const params = new URLSearchParams();
      if (selectedStore !== 'all') params.append('store_id', selectedStore);
      if (selectedPayment !== 'all') params.append('payment_method', selectedPayment);
      if (start_date) params.append('start_date', start_date);
      if (end_date) params.append('end_date', end_date);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`${API_CONFIG.BASE_URL}/client/sales/export?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return;
      const data = await response.json();
      const rows = data.sales || [];

      const header = ['Receipt', 'Date', 'Customer', 'Payment', 'Items', 'Discount', 'Total'];
      const csvRows = [
        header.join(','),
        ...rows.map((s) => {
          const itemNames = (s.sales_items || [])
            .map((i: any) => `${i.products?.name || 'Item'} x${i.quantity}`)
            .join('; ');
          return [
            s.receipt_number,
            `"${formatDate(s.created_at)}"`,
            `"${s.customer_name || 'Walk-in Customer'}"`,
            s.payment_method?.toUpperCase() || '',
            `"${itemNames}"`,
            s.discount_amount || 0,
            s.total_amount || 0,
          ].join(',');
        })
      ];

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentBadgeColor = (method) => {
    const colors = {
      cash:   'bg-green-100 text-green-800',
      card:   'bg-blue-100 text-blue-800',
      gcash:  'bg-purple-100 text-purple-800',
      bank:   'bg-orange-100 text-orange-800',
      credit: 'bg-red-100 text-red-800',
    };
    return colors[method?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentLabel = (method) => {
    const labels = {
      cash:   'CASH',
      card:   'CARD',
      gcash:  'GCASH',
      bank:   'BANK',
      credit: 'UTANG',
    };
    return labels[method?.toLowerCase()] || method?.toUpperCase() || 'N/A';
  };

  if (loading && !sales.length) {
    return (
      <SidebarProvider>
        <AppSidebar userType="client" user={user} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 px-4">
            <div className="h-5 w-5 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-24 rounded bg-gray-200 animate-pulse ml-2" />
            <div className="ml-auto h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
          </header>
          <div className="flex flex-col gap-4 p-4 pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => <div key={i} className="rounded-2xl bg-gray-200 animate-pulse h-24" />)}
            </div>
            <div className="rounded-xl border bg-white p-4 animate-pulse space-y-3">
              <div className="flex justify-between mb-2">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="flex gap-2">
                  <div className="h-8 w-48 bg-gray-200 rounded" />
                  <div className="h-8 w-8 bg-gray-200 rounded" />
                  <div className="h-8 w-24 bg-gray-200 rounded" />
                </div>
              </div>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="h-4 w-24 bg-gray-100 rounded" />
                  <div className="h-4 w-32 bg-gray-100 rounded" />
                  <div className="h-4 w-20 bg-gray-100 rounded flex-1" />
                  <div className="h-4 w-16 bg-gray-100 rounded" />
                  <div className="h-4 w-20 bg-gray-100 rounded" />
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
                  <BreadcrumbPage>Sales</BreadcrumbPage>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="hidden md:block">
              <h1 className="text-3xl font-bold tracking-tight">Sales Transactions</h1>
              <p className="text-muted-foreground mt-1">
                Manage and view all sales transactions
              </p>
            </div>
          </div>

          {/* Summary Cards - Only show if there's data */}
          {summary && summary.total_transactions > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-3.5 md:p-5 flex items-center justify-between gap-2 shadow-sm">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">Total Sales</p>
                  <p className="text-xl md:text-2xl font-bold text-white mt-0.5 truncate leading-tight">{formatCurrency(summary.total_sales)}</p>
                  <p className="text-[11px] text-white/70 mt-0.5 truncate">{summary.total_transactions} transactions</p>
                </div>
                <DollarSign className="h-8 w-8 md:h-10 md:w-10 text-white/30 shrink-0" />
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-3.5 md:p-5 flex items-center justify-between gap-2 shadow-sm">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">Average Sale</p>
                  <p className="text-xl md:text-2xl font-bold text-white mt-0.5 truncate leading-tight">{formatCurrency(summary.average_transaction)}</p>
                  <p className="text-[11px] text-white/70 mt-0.5 truncate">{summary.total_items} items sold</p>
                </div>
                <TrendingUp className="h-8 w-8 md:h-10 md:w-10 text-white/30 shrink-0" />
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-3.5 md:p-5 flex items-center justify-between gap-2 shadow-sm">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">Transactions</p>
                  <p className="text-xl md:text-2xl font-bold text-white mt-0.5 truncate leading-tight">{summary.total_transactions}</p>
                  <p className="text-[11px] text-white/70 mt-0.5 truncate">Total count</p>
                </div>
                <ShoppingCart className="h-8 w-8 md:h-10 md:w-10 text-white/30 shrink-0" />
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-3.5 md:p-5 flex items-center justify-between gap-2 shadow-sm">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">Discounts</p>
                  <p className="text-xl md:text-2xl font-bold text-white mt-0.5 truncate leading-tight">{formatCurrency(summary.total_discount)}</p>
                  <p className="text-[11px] text-white/70 mt-0.5 truncate">Given to customers</p>
                </div>
                <Receipt className="h-8 w-8 md:h-10 md:w-10 text-white/30 shrink-0" />
              </div>
            </div>
          )}

          {/* Sales Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle>Sales Transactions</CardTitle>
                  <CardDescription>Showing {sales.length} of {totalCount} transactions</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={exportToCSV}>
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1.5">Export</span>
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search receipt, customer..."
                    className="pl-8 bg-gray-50 border-gray-200 rounded-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className={(dateRange !== 'today' || selectedStore !== 'all' || selectedPayment !== 'all') ? "border-[#E8302A] text-[#E8302A]" : ""}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-64">
                    <p className="text-sm font-medium mb-3">Filters</p>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Date Range</p>
                        <Select value={dateRange} onValueChange={(v) => { setDateRange(v); setPage(1); }}>
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="yesterday">Yesterday</SelectItem>
                            <SelectItem value="week">Last 7 Days</SelectItem>
                            <SelectItem value="month">Last 30 Days</SelectItem>
                            <SelectItem value="all">All Time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {stores.length > 1 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Store</p>
                          <Select value={selectedStore} onValueChange={(v) => { setSelectedStore(v); setPage(1); }}>
                            <SelectTrigger className="w-full"><SelectValue placeholder="All Stores" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Stores</SelectItem>
                              {stores.map((store) => (
                                <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                        <Select value={selectedPayment} onValueChange={(v) => { setSelectedPayment(v); setPage(1); }}>
                          <SelectTrigger className="w-full"><SelectValue placeholder="All Payments" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Payments</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="gcash">GCash</SelectItem>
                            <SelectItem value="bank">Bank Transfer</SelectItem>
                            <SelectItem value="credit">Utang (Credit)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {(dateRange !== 'today' || selectedStore !== 'all' || selectedPayment !== 'all') && (
                        <Button variant="ghost" size="sm" className="w-full text-gray-500 text-xs"
                          onClick={() => { setDateRange('today'); setSelectedStore('all'); setSelectedPayment('all'); setPage(1); }}>
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt</TableHead>
                      <TableHead className="hidden sm:table-cell">Date & Time</TableHead>
                      <TableHead className="hidden lg:table-cell">Customer</TableHead>
                      <TableHead className="hidden xl:table-cell">Items</TableHead>
                      <TableHead className="hidden md:table-cell">Payment</TableHead>
                      <TableHead className="hidden xl:table-cell">Staff</TableHead>
                      <TableHead className="hidden sm:table-cell text-right">Amount</TableHead>
                      <TableHead className="text-center w-14">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                        </TableCell>
                      </TableRow>
                    ) : sales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No sales found. Try adjusting your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sales.map((sale) => (
                        <TableRow key={sale.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-mono text-xs leading-tight">
                                <span className="hidden lg:inline">{sale.receipt_number}</span>
                                <span className="lg:hidden text-gray-600">#{sale.receipt_number.split('-').pop()}</span>
                              </p>
                              <span className="sm:hidden text-xs font-semibold shrink-0">{formatCurrency(sale.total_amount)}</span>
                            </div>
                            {/* Mobile-only sub-info */}
                            <div className="sm:hidden mt-0.5 flex items-center gap-1.5">
                              <span className="text-xs text-muted-foreground truncate">{formatDate(sale.created_at)}</span>
                              <Badge className={`text-xs shrink-0 ${getPaymentBadgeColor(sale.payment_method)}`}>
                                {getPaymentLabel(sale.payment_method)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm whitespace-nowrap">
                            {formatDate(sale.created_at)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="text-sm">
                              <p className="font-medium">{sale.customer_name || 'Walk-in Customer'}</p>
                              {sale.customer_phone && (
                                <p className="text-muted-foreground text-xs">{sale.customer_phone}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            <Badge variant="outline">{sale.items_count} items</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge className={getPaymentBadgeColor(sale.payment_method)}>
                              {getPaymentLabel(sale.payment_method)}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell text-sm">
                            {sale.staff?.name || sale.created_by_user?.name || 'Manager'}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-right font-semibold whitespace-nowrap">
                            {formatCurrency(sale.total_amount)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Link to={`/client/sales/${sale.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}