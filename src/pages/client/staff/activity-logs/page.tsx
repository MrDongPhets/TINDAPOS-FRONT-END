// src/app/client/staff/activity-logs/page.jsx - COMPLETE with sidebar
'use client';

import { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  LogIn, 
  LogOut, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
  Calendar,
  User
} from 'lucide-react';
import API_CONFIG from '@/config/api';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [filters, setFilters] = useState({
    staff_id: '',
    action_type: '',
    limit: 50,
    offset: 0
  });
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // Get user and company data
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      if (parsedUser.company_id) {
        fetchCompany(parsedUser.company_id);
      }
    }
    
    fetchStaff();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchCompany = async (companyId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_CONFIG.BASE_URL}/admin/companies/${companyId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCompany(data.company);
      }
    } catch (err) {
      console.error('Failed to fetch company:', err);
    }
  };

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_CONFIG.BASE_URL}/staff/manage/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStaff(data.staff || []);
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const params = new URLSearchParams();
      if (filters.staff_id) params.append('staff_id', filters.staff_id);
      if (filters.action_type) params.append('action_type', filters.action_type);
      params.append('limit', String(filters.limit));
      params.append('offset', String(filters.offset));

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/staff/permissions/activity-logs?${params}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'login':
        return <LogIn className="h-4 w-4 text-green-500" />;
      case 'logout':
        return <LogOut className="h-4 w-4 text-gray-500" />;
      case 'manager_override':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'failed_login':
      case 'failed_manager_override':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'role_changed':
        return <CheckCircle className="h-4 w-4 text-purple-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    }
  };

  const getActionBadge = (actionType) => {
    const colors = {
      login: 'bg-green-100 text-green-700',
      logout: 'bg-gray-100 text-gray-700',
      manager_override: 'bg-blue-100 text-blue-700',
      failed_login: 'bg-red-100 text-red-700',
      failed_manager_override: 'bg-red-100 text-red-700',
      role_changed: 'bg-purple-100 text-purple-700',
      void_transaction: 'bg-orange-100 text-orange-700',
      apply_discount: 'bg-yellow-100 text-yellow-700',
      process_refund: 'bg-pink-100 text-pink-700'
    };

    return colors[actionType] || 'bg-gray-100 text-gray-700';
  };

  const formatActionType = (actionType) => {
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePrevPage = () => {
    if (filters.offset > 0) {
      setFilters(prev => ({
        ...prev,
        offset: Math.max(0, prev.offset - prev.limit)
      }));
    }
  };

  const handleNextPage = () => {
    if (filters.offset + filters.limit < total) {
      setFilters(prev => ({
        ...prev,
        offset: prev.offset + prev.limit
      }));
    }
  };

  const currentPage = Math.floor(filters.offset / filters.limit) + 1;
  const totalPages = Math.ceil(total / filters.limit);

  if (loading && logs.length === 0) {
    return (
      <SidebarProvider>
        <AppSidebar userType="client" user={user} company={company} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 px-4">
            <div className="h-5 w-5 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-32 rounded bg-gray-200 animate-pulse ml-2" />
            <div className="ml-auto h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
          </header>
          <div className="flex flex-col gap-4 p-4 pt-0">
            <div className="flex gap-3 mb-2">
              <div className="h-9 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-9 w-40 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="rounded-xl border bg-white p-4 animate-pulse space-y-3">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex gap-3 items-center py-2 border-b border-gray-50">
                  <div className="h-8 w-8 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-40 bg-gray-200 rounded" />
                    <div className="h-3 w-56 bg-gray-100 rounded" />
                  </div>
                  <div className="h-5 w-16 bg-gray-100 rounded-full" />
                  <div className="h-3 w-24 bg-gray-100 rounded" />
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
      <AppSidebar userType="client" user={user} company={company} />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/client">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/client/staff">
                    Staff
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Activity Logs</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
              <p className="text-gray-600 mt-1">Monitor staff actions and system events</p>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Staff Filter */}
                  <div className="space-y-2">
                    <Label>Staff Member</Label>
                    <Select
                      value={filters.staff_id || "all"}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, staff_id: value === "all" ? "" : value, offset: 0 }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All staff" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Staff</SelectItem>
                        {staff.map(member => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name} ({member.staff_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Action Type Filter */}
                  <div className="space-y-2">
                    <Label>Action Type</Label>
                    <Select
                      value={filters.action_type || "all"}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, action_type: value === "all" ? "" : value, offset: 0 }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All actions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="login">Login</SelectItem>
                        <SelectItem value="logout">Logout</SelectItem>
                        <SelectItem value="manager_override">Manager Override</SelectItem>
                        <SelectItem value="failed_login">Failed Login</SelectItem>
                        <SelectItem value="role_changed">Role Changed</SelectItem>
                        <SelectItem value="void_transaction">Void Transaction</SelectItem>
                        <SelectItem value="apply_discount">Apply Discount</SelectItem>
                        <SelectItem value="process_refund">Process Refund</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Results per page */}
                  <div className="space-y-2">
                    <Label>Results per page</Label>
                    <Select
                      value={filters.limit.toString()}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, limit: parseInt(value), offset: 0 }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Logs List */}
            <Card>
              <CardHeader>
                <CardTitle>Activity History</CardTitle>
                <CardDescription>
                  Showing {logs.length} of {total} total logs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No activity logs found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="mt-1">
                          {getActionIcon(log.action_type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge className={getActionBadge(log.action_type)}>
                              {formatActionType(log.action_type)}
                            </Badge>
                            <span className="text-sm font-medium text-gray-900">
                              {log.staff?.name || 'Unknown Staff'}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({log.staff?.staff_id})
                            </span>
                            {log.staff?.role && (
                              <Badge variant="outline" className="text-xs">
                                {log.staff.role}
                              </Badge>
                            )}
                          </div>

                          {/* Action Details */}
                          {log.action_details && Object.keys(log.action_details).length > 0 && (
                            <div className="text-sm text-gray-600 space-y-1">
                              {log.action_details.reason && (
                                <p>Reason: {log.action_details.reason}</p>
                              )}
                              {log.action_details.authorized_by_name && (
                                <p>Authorized by: {log.action_details.authorized_by_name}</p>
                              )}
                              {log.action_details.old_role && log.action_details.new_role && (
                                <p>
                                  Role changed: {log.action_details.old_role} → {log.action_details.new_role}
                                </p>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(log.created_at)}</span>
                            {log.ip_address && (
                              <>
                                <span>•</span>
                                <span>IP: {log.ip_address}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {total > filters.limit && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevPage}
                        disabled={filters.offset === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={filters.offset + filters.limit >= total}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}