import { useState, useEffect } from 'react'
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/ui/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  CreditCard, RefreshCw, CheckCircle, XCircle, Clock, Building2, Calendar, Plus
} from 'lucide-react'
import { toast } from "sonner"
import API_CONFIG from '@/config/api'

const STATUS_CONFIG = {
  trial:    { label: 'Trial',    color: 'bg-blue-100 text-blue-800' },
  active:   { label: 'Active',   color: 'bg-green-100 text-green-800' },
  expired:  { label: 'Expired',  color: 'bg-red-100 text-red-800' },
  suspended:{ label: 'Suspended',color: 'bg-yellow-100 text-yellow-800' },
}

export default function AdminSubscriptions() {
  const [user, setUser] = useState(null)
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)

  const [activateDialog, setActivateDialog] = useState(false)
  const [extendDialog, setExtendDialog] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [months, setMonths] = useState(1)
  const [days, setDays] = useState(30)
  const [activatePlan, setActivatePlan] = useState('basic')

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    'Content-Type': 'application/json',
  })

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_CONFIG.BASE_URL}/admin/subscriptions`, { headers: getAuthHeaders() })
      const data = await res.json()
      setCompanies(data.companies || [])
    } catch {
      toast.error('Failed to load subscriptions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const userData = localStorage.getItem('userData')
    if (userData) setUser(JSON.parse(userData))
    fetchSubscriptions()
  }, [])

  const handleActivate = async () => {
    if (!selectedCompany) return
    setProcessingId(selectedCompany.id)
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/admin/subscriptions/activate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ company_id: selectedCompany.id, months, plan: activatePlan }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Subscription activated for ${selectedCompany.name}`)
        setActivateDialog(false)
        fetchSubscriptions()
      } else {
        toast.error(data.error || 'Failed to activate')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeactivate = async (company) => {
    setProcessingId(company.id)
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/admin/subscriptions/deactivate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ company_id: company.id }),
      })
      if (res.ok) {
        toast.success(`Subscription deactivated for ${company.name}`)
        fetchSubscriptions()
      } else {
        toast.error('Failed to deactivate')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleExtendTrial = async () => {
    if (!selectedCompany) return
    setProcessingId(selectedCompany.id)
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/admin/subscriptions/extend-trial`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ company_id: selectedCompany.id, days }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Trial extended for ${selectedCompany.name}`)
        setExtendDialog(false)
        fetchSubscriptions()
      } else {
        toast.error(data.error || 'Failed to extend trial')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setProcessingId(null)
    }
  }

  const stats = {
    total: companies.length,
    active: companies.filter(c => c.subscription_status === 'active').length,
    trial: companies.filter(c => c.subscription_status === 'trial').length,
    expired: companies.filter(c => c.subscription_status === 'expired').length,
  }

  return (
    <SidebarProvider>
      <AppSidebar userType="super_admin" user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/admin/dashboard">Admin</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Subscriptions</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <CreditCard className="h-6 w-6" /> Subscriptions
              </h1>
              <p className="text-gray-500 text-sm mt-1">Manage client subscription status</p>
            </div>
            <Button variant="outline" onClick={fetchSubscriptions} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total', value: stats.total, icon: Building2, color: 'text-gray-600' },
              { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-green-600' },
              { label: 'Trial', value: stats.trial, icon: Clock, color: 'text-blue-600' },
              { label: 'Expired', value: stats.expired, icon: XCircle, color: 'text-red-600' },
            ].map(s => (
              <Card key={s.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <s.icon className={`h-8 w-8 ${s.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Companies</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Trial / Sub End</TableHead>
                      <TableHead>Days Left</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map(company => {
                      const statusCfg = STATUS_CONFIG[company.subscription_status] || STATUS_CONFIG.expired
                      const endDate = company.subscription_status === 'active'
                        ? company.subscription_end_date
                        : company.trial_end_date
                      const isProcessing = processingId === company.id

                      return (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">{company.name}</TableCell>
                          <TableCell className="text-sm text-gray-600">{company.contact_email}</TableCell>
                          <TableCell>
                            <Badge className={company.subscription_plan === 'laking-negosyo' || company.subscription_plan === 'standard' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}>
                              {company.subscription_plan === 'laking-negosyo' ? 'Laking Negosyo'
                                : company.subscription_plan === 'standard' ? 'Standard (Legacy)'
                                : company.subscription_plan === 'negosyo' ? 'Negosyo'
                                : 'Basic (Legacy)'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {endDate ? new Date(endDate).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell>
                            {company.days_left !== null ? (
                              <span className={company.days_left <= 0 ? 'text-red-600 font-medium' : company.days_left <= 7 ? 'text-yellow-600 font-medium' : 'text-gray-700'}>
                                {company.days_left <= 0 ? 'Expired' : `${company.days_left}d`}
                              </span>
                            ) : '—'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {new Date(company.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-600 border-blue-200"
                                disabled={isProcessing}
                                onClick={() => { setSelectedCompany(company); setDays(30); setExtendDialog(true) }}
                              >
                                <Calendar className="h-3 w-3 mr-1" /> Extend Trial
                              </Button>
                              {company.subscription_status !== 'active' ? (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  disabled={isProcessing}
                                  onClick={() => { setSelectedCompany(company); setMonths(1); setActivatePlan(company.subscription_plan || 'basic'); setActivateDialog(true) }}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" /> Activate
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={isProcessing}
                                  onClick={() => handleDeactivate(company)}
                                >
                                  <XCircle className="h-3 w-3 mr-1" /> Deactivate
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {companies.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-400">No companies found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activate Dialog */}
        <Dialog open={activateDialog} onOpenChange={setActivateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Activate Subscription</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-gray-600">
                Activating subscription for <strong>{selectedCompany?.name}</strong>
              </p>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={activatePlan} onValueChange={setActivatePlan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="negosyo">Negosyo — ₱299/mo (1 store)</SelectItem>
                    <SelectItem value="laking-negosyo">Laking Negosyo — ₱599/mo (5 stores)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="months">Duration (months)</Label>
                <Input
                  id="months"
                  type="number"
                  min={1}
                  max={24}
                  value={months}
                  onChange={e => setMonths(Number(e.target.value))}
                />
              </div>
              <p className="text-xs text-gray-500">
                Subscription will be active until: <strong>{new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</strong>
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActivateDialog(false)}>Cancel</Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleActivate} disabled={!!processingId}>
                <CheckCircle className="h-4 w-4 mr-2" /> Activate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Extend Trial Dialog */}
        <Dialog open={extendDialog} onOpenChange={setExtendDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Extend Trial</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-gray-600">
                Extending trial for <strong>{selectedCompany?.name}</strong>
              </p>
              <div className="space-y-2">
                <Label htmlFor="days">Days to add</Label>
                <Input
                  id="days"
                  type="number"
                  min={1}
                  max={365}
                  value={days}
                  onChange={e => setDays(Number(e.target.value))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExtendDialog(false)}>Cancel</Button>
              <Button onClick={handleExtendTrial} disabled={!!processingId}>
                <Plus className="h-4 w-4 mr-2" /> Extend Trial
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
