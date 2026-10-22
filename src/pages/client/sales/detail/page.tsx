import { formatCurrency } from '@/lib/utils'
// src/app/client/sales/[id]/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Printer,
  XCircle,
  AlertCircle,
  Receipt,
  User,
  Store,
  CreditCard,
  Package,
  Calendar,
  Hash
} from 'lucide-react';
import API_CONFIG from '@/config/api';
import { SaleAdjustmentDialog } from '@/components/sales/SaleAdjustmentDialog';
import { SaleAdjustmentsCard } from '@/components/sales/SaleAdjustmentsCard';
import { ADJUSTMENT_STATUS_LABEL, saleAdjustmentStatus, type SaleAdjustment } from '@/lib/saleAdjustments';
import { buildInvoiceHtml, einvoiceRows, invoiceKind, invoiceNumber, printInvoice, readCachedCompany, resolveSeller, type InvoiceSeller } from '@/lib/invoice';

export default function SaleDetailsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const saleId = params.id;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sale, setSale] = useState(null);
  const [sellerInfo, setSellerInfo] = useState<InvoiceSeller | null>(null);
  const [adjustments, setAdjustments] = useState<SaleAdjustment[]>([]);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustNotice, setAdjustNotice] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user && saleId) {
      fetchSaleDetails();
    }
  }, [user, saleId]);

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

  const fetchSaleDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${API_CONFIG.BASE_URL}/client/sales/${saleId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Sale not found');
        }
        throw new Error('Failed to fetch sale details');
      }

      const data = await response.json();
      setSale({ ...data.sale, einvoice: data.einvoice || null });
      setSellerInfo(data.seller || null);
      setAdjustments(data.adjustments || []);

    } catch (err) {
      console.error('Error fetching sale:', err);
      setError(err.message || 'Failed to load sale details');
    } finally {
      setLoading(false);
    }
  };

  // Reprint with the same invoice layout as the POS (seller BIR details come from the server)
  const handlePrint = () => {
    const seller = resolveSeller(sellerInfo, sale.stores, readCachedCompany())
    const items = (sale.items || []).map(item => ({
      name: item.products?.name || 'Product',
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      discount: Number(item.discount_amount || 0),
    }))
    printInvoice(buildInvoiceHtml({ sale, items, seller, staffName: sale.staff?.name }))
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentBadgeColor = (method) => {
    const colors = {
      cash: 'bg-green-100 text-green-800',
      card: 'bg-blue-100 text-blue-800',
      gcash: 'bg-purple-100 text-purple-800',
      bank: 'bg-orange-100 text-orange-800'
    };
    return colors[method?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
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
            <div className="flex items-center justify-between">
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="flex gap-2">
                <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border bg-white p-4 animate-pulse space-y-3">
                <div className="h-4 w-28 bg-gray-200 rounded" />
                {[...Array(4)].map((_, i) => <div key={i} className="h-3 bg-gray-100 rounded w-full" />)}
              </div>
              <div className="md:col-span-2 rounded-xl border bg-white p-4 animate-pulse">
                <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gray-100 rounded" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                        <div className="h-3 bg-gray-100 rounded w-1/3" />
                      </div>
                      <div className="h-4 w-16 bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error) {
    return (
      <SidebarProvider>
        <AppSidebar userType="client" user={user} />
        <SidebarInset>
          <div className="flex flex-col items-center justify-center h-screen gap-4">
            <AlertCircle className="h-12 w-12 text-red-600" />
            <h2 className="text-2xl font-bold">Error Loading Sale</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => navigate('/client/sales')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sales
            </Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!sale) return null;

  const adjStatus = saleAdjustmentStatus(sale);
  const refunded = Number(sale.refunded_amount || 0);

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
                  <BreadcrumbLink href="/client/sales">Sales</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Sale Details</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 pb-32 min-w-0 overflow-hidden">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm text-muted-foreground">{sale.receipt_number}</p>
              {adjStatus && (
                <Badge variant={adjStatus === 'partially_returned' ? 'secondary' : 'destructive'}>{ADJUSTMENT_STATUS_LABEL[adjStatus]}</Badge>
              )}
            </div>
            <div className="flex gap-2 items-start sm:items-end">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              {adjStatus !== 'voided' && adjStatus !== 'returned' && (
                <Button variant="destructive" onClick={() => setAdjustOpen(true)}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Void / Return
                </Button>
              )}
            </div>
          </div>

          {adjustNotice && (
            <Alert>
              <AlertDescription>{adjustNotice}</AlertDescription>
            </Alert>
          )}

          <SaleAdjustmentDialog
            key={adjustOpen ? 'open' : 'closed'}
            open={adjustOpen}
            onOpenChange={setAdjustOpen}
            saleId={saleId}
            items={sale.items || []}
            adjustments={adjustments}
            onDone={(a) => {
              setAdjustNotice(`${a.adjustment_no} saved — give back ${formatCurrency(Number(a.total_amount))}. Stock was returned to inventory.`);
              fetchSaleDetails();
            }}
          />

          <div className="grid gap-4 md:grid-cols-3 min-w-0 w-full">
            {/* Sale Information */}
            <div className="md:col-span-2 space-y-4 min-w-0 w-full">
              {/* Transaction Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Transaction Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {sale.or_number && (
                    <div className="md:col-span-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <Label className="text-xs font-medium text-primary/70">{invoiceKind(resolveSeller(sellerInfo, sale.stores, readCachedCompany()), sale).numberLabel}</Label>
                      <p className="text-xl font-mono font-bold text-primary">{invoiceNumber(sale)}</p>
                      {einvoiceRows(sale).map(r => (
                        <p key={r.label} className="text-xs text-gray-600 mt-1">{r.label} <span className="font-semibold">{r.value}</span>{r.note && <> — {r.note}</>}</p>
                      ))}
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Reference</Label>
                    <p className="text-sm font-mono">{sale.receipt_number}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Date & Time</Label>
                    <p className="text-sm">{formatDate(sale.created_at)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Payment Method</Label>
                    <Badge className={`${getPaymentBadgeColor(sale.payment_method)} mt-1`}>
                      {sale.payment_method?.toUpperCase() || 'N/A'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Items Count</Label>
                    <p className="text-sm">{sale.items_count} items</p>
                  </div>
                </CardContent>
              </Card>

              {/* Items Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Items ({sale.items?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto w-full">
                    <Table className="min-w-[420px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Discount</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sale.items?.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.products?.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  SKU: {item.products?.sku}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.unit_price)}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.discount_amount > 0 ? (
                                <span className="text-orange-600">
                                  -{formatCurrency(item.discount_amount)}
                                </span>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(item.total_price)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <SaleAdjustmentsCard adjustments={adjustments} />

              {/* Notes */}
              {sale.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{sale.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4 pb-4 min-w-0 w-full">
              {/* Total Amount */}
              <Card>
                <CardHeader>
                  <CardTitle>Amount Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm gap-2">
                    <span className="text-muted-foreground shrink-0">Subtotal</span>
                    <span className="text-right">{formatCurrency(sale.subtotal || sale.total_amount)}</span>
                  </div>
                  {sale.discount_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="text-orange-600">
                        -{formatCurrency(sale.discount_amount)}
                      </span>
                    </div>
                  )}
                  {(sale.vatable_amount > 0 || sale.vat_exempt_amount > 0 || sale.zero_rated_amount > 0) && (
                    <>
                      <Separator />
                      <p className="text-xs font-medium text-muted-foreground">VAT Breakdown</p>
                      {sale.vatable_amount > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">VATable Sales (ex-VAT)</span>
                          <span>{formatCurrency(sale.vatable_amount / 1.12)}</span>
                        </div>
                      )}
                      {sale.vat_exempt_amount > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">VAT-Exempt</span>
                          <span>{formatCurrency(sale.vat_exempt_amount)}</span>
                        </div>
                      )}
                      {sale.zero_rated_amount > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Zero-Rated</span>
                          <span>{formatCurrency(sale.zero_rated_amount)}</span>
                        </div>
                      )}
                      {sale.tax_amount > 0 && (
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-muted-foreground">VAT 12%</span>
                          <span>{formatCurrency(sale.tax_amount)}</span>
                        </div>
                      )}
                    </>
                  )}
                  <Separator />
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold shrink-0">Total Amount</span>
                    <span className="text-2xl font-bold text-green-600 text-right">
                      {formatCurrency(sale.total_amount)}
                    </span>
                  </div>
                  {refunded > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Given back (voids / returns)</span>
                        <span className="text-red-600">-{formatCurrency(refunded)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Net sale</span>
                        <span>{formatCurrency(Number(sale.total_amount) - refunded)}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <p className="text-sm font-medium">
                      {sale.customer_name || 'Walk-in Customer'}
                    </p>
                  </div>
                  {sale.customer_phone && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      <p className="text-sm">{sale.customer_phone}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Store Info */}
              {sale.stores && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Store className="h-4 w-4" />
                      Store Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Store Name</Label>
                      <p className="text-sm font-medium">{sale.stores.name}</p>
                    </div>
                    {sale.stores.address && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Address</Label>
                        <p className="text-sm">{sale.stores.address}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Staff Info */}
              {sale.staff && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <User className="h-4 w-4" />
                      Staff Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Staff Name</Label>
                      <p className="text-sm font-medium">{sale.staff.name}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Staff ID</Label>
                      <p className="text-sm font-mono">{sale.staff.staff_id}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Role</Label>
                      <Badge variant="outline">{sale.staff.role}</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}