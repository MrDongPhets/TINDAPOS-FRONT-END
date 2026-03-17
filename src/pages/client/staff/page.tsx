// src/app/client/staff/page.jsx - COMPLETE with sidebar and permissions
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Store,
  Filter,
  FileText,
  Copy,
  Check,
  Building2
} from 'lucide-react';
import API_CONFIG from '@/config/api';
import PermissionMatrix from '@/components/staff/PermissionMatrix';

export default function StaffPage() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [stores, setStores] = useState([]);
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedStore, setSelectedStore] = useState('all');
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyCode, setCompanyCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const [formData, setFormData] = useState({
    staff_id: '',
    name: '',
    passcode: '',
    role: 'staff',
    store_id: ''
  });

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // For client users, company info is in user object
      if (parsedUser.company_id) {
        setCompany({
          id: parsedUser.company_id,
          name: parsedUser.company_name || 'Your Company'
        });
      }
    }
    
    fetchStores();
    fetchStaff();
    fetchPermissions();
    fetchCompanyCode();
  }, []);

  const fetchCompanyCode = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_CONFIG.BASE_URL}/client/company`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.company?.company_code) setCompanyCode(data.company.company_code);
    } catch {}
  };

  const copyCompanyCode = () => {
    if (companyCode) {
      navigator.clipboard.writeText(companyCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const fetchPermissions = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_CONFIG.BASE_URL}/staff/permissions/roles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions);
      }
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
    }
  };

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_CONFIG.BASE_URL}/client/dashboard/stores`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStores(data.stores || []);
      }
    } catch (err) {
      console.error('Failed to fetch stores:', err);
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
      setError('Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.staff_id || !formData.name || !formData.passcode || !formData.store_id) {
      setError('Please fill in all fields and select a store');
      return;
    }
    if (formData.passcode.length < 4 || formData.passcode.length > 6) {
      setError('PIN must be 4–6 digits');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_CONFIG.BASE_URL}/staff/manage/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Staff ${formData.name} created successfully`);
        setIsDialogOpen(false);
        setFormData({
          staff_id: '',
          name: '',
          passcode: '',
          role: 'staff',
          store_id: ''
        });
        fetchStaff();
      } else {
        setError(data.error || 'Failed to create staff');
      }
    } catch (err) {
      setError('Failed to create staff');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_CONFIG.BASE_URL}/staff/manage/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess(`Staff ${name} deleted successfully`);
        fetchStaff();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete staff');
      }
    } catch (err) {
      setError('Failed to delete staff');
    }
  };

  const toggleActive = async (id, currentStatus, name) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_CONFIG.BASE_URL}/staff/manage/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (response.ok) {
        setSuccess(`Staff ${name} ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchStaff();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update staff');
      }
    } catch (err) {
      setError('Failed to update staff');
    }
  };

  const getStoreName = (storeId) => {
    const store = stores.find(s => s.id === storeId);
    return store ? store.name : storeId;
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'manager':
        return 'bg-purple-100 text-purple-700';
      case 'supervisor':
        return 'bg-blue-100 text-blue-700';
      case 'staff':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredStaff = selectedStore === 'all' 
    ? staff 
    : staff.filter(s => s.store_id === selectedStore);

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar userType="client" user={user} company={company} />
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
                <BreadcrumbItem>
                  <BreadcrumbPage>Staff Management</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="hidden md:block">
                <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
                <p className="text-gray-600 mt-1">Manage your team members and their access</p>
              </div>

              <div className="flex gap-2 items-start sm:items-end">
                {permissions && <PermissionMatrix permissions={permissions} />}

                <Button
                  variant="outline"
                  onClick={() => navigate('/client/staff/activity-logs')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Activity Logs
                </Button>

              </div>
            </div>

            {/* Company Code */}
            {companyCode && (
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-white/70 font-medium">Staff Login Code</p>
                    <p className="text-2xl font-mono font-bold tracking-widest text-white leading-tight">{companyCode}</p>
                    <p className="text-[11px] text-white/60 mt-0.5">Share this code so staff can log in</p>
                  </div>
                </div>
                <button
                  onClick={copyCompanyCode}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white text-blue-600 text-sm font-semibold rounded-xl hover:bg-blue-50 transition-colors shrink-0"
                >
                  {codeCopied ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy</>}
                </button>
              </div>
            )}

            {/* Success/Error Messages */}
            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Store Filter */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Filter className="h-5 w-5 text-gray-500" />
                  <Select value={selectedStore} onValueChange={setSelectedStore}>
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stores</SelectItem>
                      {stores.map(store => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-600">
                    {filteredStaff.length} staff member{filteredStaff.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Staff List */}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>
                      Manage staff accounts and their permission levels
                    </CardDescription>
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Staff
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Staff Member</DialogTitle>
                        <DialogDescription>
                          Create a new staff account with PIN-based login
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="staff_id">Staff ID</Label>
                          <Input id="staff_id" placeholder="STF001" value={formData.staff_id}
                            onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input id="name" placeholder="John Doe" value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="store_id">Store</Label>
                          <Select value={formData.store_id} onValueChange={(value) => setFormData({ ...formData, store_id: value })} required>
                            <SelectTrigger><SelectValue placeholder="Select store" /></SelectTrigger>
                            <SelectContent>
                              {stores.map(store => (
                                <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="passcode">PIN Code (4-6 digits)</Label>
                          <Input id="passcode" type="password" placeholder="1234" maxLength={6}
                            value={formData.passcode}
                            onChange={(e) => setFormData({ ...formData, passcode: e.target.value.replace(/\D/g, '') })} required />
                          <p className="text-xs text-gray-500">Staff will use this PIN to login to POS</p>
                        </div>
                        {error && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">Cancel</Button>
                          <Button type="submit" disabled={submitting} className="flex-1">
                            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                            {submitting ? 'Creating...' : 'Create Staff'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {filteredStaff.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {selectedStore === 'all' ? 'No staff members yet' : 'No staff in this store'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {selectedStore === 'all' 
                        ? 'Get started by adding your first team member' 
                        : 'Add staff to this store or select a different store'}
                    </p>
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Staff
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredStaff.map((member) => (
                      <div
                        key={member.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            member.is_active ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                          }`}>
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">{member.name}</h3>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${getRoleBadgeColor(member.role)}`}>
                                {member.role}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
                              <span>ID: {member.staff_id}</span>
                              <span className="hidden sm:inline">•</span>
                              <div className="flex items-center gap-1">
                                <Store className="h-3 w-3" />
                                {getStoreName(member.store_id)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            title={member.is_active ? 'Deactivate' : 'Activate'}
                            onClick={() => toggleActive(member.id, member.is_active, member.name)}
                          >
                            {member.is_active ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(member.id, member.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
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