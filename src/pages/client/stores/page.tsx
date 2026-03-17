// src/pages/client/stores/page.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/ui/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Plus, Store, MapPin, Phone, CheckCircle, XCircle, Pause, RefreshCw, AlertCircle } from 'lucide-react'
import { toast } from "sonner"
import API_CONFIG from "@/config/api"
import { UserMenuDropdown } from "@/components/ui/UserMenuDropdown"

export default function ClientStores() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [stores, setStores] = useState([])
  const [storeLimit, setStoreLimit] = useState(1)
  const [plan, setPlan] = useState('basic')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({ name: '', address: '', phone: '', description: '' })

  useEffect(() => {
    const userData = localStorage.getItem('userData')
    if (userData) setUser(JSON.parse(userData))
    fetchStores()
  }, [])

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    'Content-Type': 'application/json',
  })

  const fetchStores = async () => {
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/client/stores`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setStores(data.stores || [])
        setStoreLimit(data.store_limit ?? 1)
        setPlan(data.plan || 'basic')
      } else {
        toast.error('Failed to fetch stores')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => { setRefreshing(true); fetchStores() }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/client/stores/request`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Store created successfully!')
        setShowDialog(false)
        setFormData({ name: '', address: '', phone: '', description: '' })
        fetchStores()
      } else {
        toast.error(data.error || 'Failed to create store')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status) => {
    const cfg = {
      active:    { icon: CheckCircle, text: 'Active',     cls: 'bg-green-100 text-green-800' },
      suspended: { icon: Pause,       text: 'Suspended',  cls: 'bg-gray-100 text-gray-800' },
      cancelled: { icon: XCircle,     text: 'Inactive',   cls: 'bg-red-100 text-red-800' },
    }[status] || { icon: CheckCircle, text: 'Active', cls: 'bg-green-100 text-green-800' }
    return (
      <Badge className={cfg.cls}>
        <cfg.icon className="w-3 h-3 mr-1" />
        {cfg.text}
      </Badge>
    )
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar userType="client" user={user} />
        <SidebarInset>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading stores...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar userType="client" user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 overflow-hidden">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/client/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Stores</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto px-4 flex items-center gap-2 min-w-0 overflow-hidden">
            <UserMenuDropdown />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 pb-24">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="hidden md:block">
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <Store className="h-6 w-6 text-blue-600" />
                My Stores
              </h1>
              <p className="text-gray-600 mt-1">
                {stores.length} / {storeLimit} store{storeLimit !== 1 ? 's' : ''} used
                <span className="ml-2 text-xs text-gray-400 capitalize">({plan} plan)</span>
              </p>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2">
              {stores.length >= storeLimit && (
                <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                  <AlertCircle className="h-3 w-3" />
                  {plan === 'negosyo' || plan === 'basic' ? 'Upgrade to Laking Negosyo for 5 stores' : 'Store limit reached'}
                </div>
              )}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button disabled={stores.length >= storeLimit}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Store
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Store</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    Your store will be active immediately after creation.
                  </p>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Store Name *</Label>
                    <Input id="name" name="name" value={formData.name}
                      onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                      placeholder="Enter store name" required />
                  </div>
                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Textarea id="address" name="address" value={formData.address}
                      onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                      placeholder="Enter store address" required rows={3} />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" value={formData.phone} type="tel"
                      onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                      placeholder="Enter phone number" />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" value={formData.description}
                      onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                      placeholder="Additional details about the store" rows={2} />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Creating...' : 'Create Store'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
              <p className="text-white/80 text-sm font-medium">Total Stores</p>
              <p className="text-3xl font-bold mt-1">{stores.length}</p>
              <div className="flex items-center gap-1 mt-2 text-white/70 text-xs">
                <Store className="h-3.5 w-3.5" />
                <span>{storeLimit} limit</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
              <p className="text-white/80 text-sm font-medium">Active</p>
              <p className="text-3xl font-bold mt-1">{stores.filter(s => s.status === 'active' || s.is_active).length}</p>
              <div className="flex items-center gap-1 mt-2 text-white/70 text-xs">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Running</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-slate-500 to-gray-600 rounded-2xl p-4 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
              <p className="text-white/80 text-sm font-medium">Inactive</p>
              <p className="text-3xl font-bold mt-1">{stores.filter(s => s.status === 'suspended' || s.status === 'cancelled').length}</p>
              <div className="flex items-center gap-1 mt-2 text-white/70 text-xs">
                <XCircle className="h-3.5 w-3.5" />
                <span>Suspended</span>
              </div>
            </div>
          </div>

          {/* Stores Grid */}
          {stores.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Store className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No stores yet</h3>
                <p className="text-muted-foreground mb-4">Create your first store to get started.</p>
                <Button onClick={() => setShowDialog(true)} disabled={stores.length >= storeLimit}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Store
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {stores.map(store => (
                <Card key={store.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Store className="w-5 h-5 text-primary" />
                        <CardTitle className="text-lg">{store.name}</CardTitle>
                      </div>
                      {getStatusBadge(store.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {store.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <span className="text-sm text-muted-foreground">{store.address}</span>
                        </div>
                      )}
                      {store.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{store.phone}</span>
                        </div>
                      )}
                      <div className="pt-1 text-xs text-muted-foreground">
                        Created: {new Date(store.created_at).toLocaleDateString()}
                      </div>
                      {(store.status === 'active' || store.is_active) && (
                        <div className="pt-1">
                          <Button size="sm" className="w-full"
                            onClick={() => navigate(`/client/dashboard?store=${store.id}`)}>
                            Go to Dashboard
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
