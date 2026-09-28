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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import {
  CreditCard, RefreshCw, CheckCircle, XCircle, Clock, Building2, Calendar, Plus,
  MoreHorizontal, Pencil, Trash2, RotateCcw, AlertTriangle
} from 'lucide-react'
import { toast } from "sonner"
import API_CONFIG from '@/config/api'

const STATUS_CONFIG = {
  trial:    { label: 'Trial',    color: 'bg-blue-100 text-blue-800' },
  active:   { label: 'Active',   color: 'bg-green-100 text-green-800' },
  expired:  { label: 'Expired',  color: 'bg-red-100 text-red-800' },
  suspended:{ label: 'Suspended',color: 'bg-yellow-100 text-yellow-800' },
}

// ISO timestamp → YYYY-MM-DD (local) for <input type="date">
const toDateInput = (iso) => (iso ? new Date(iso).toLocaleDateString('en-CA') : '')
// YYYY-MM-DD → ISO at end of that local day
const fromDateInput = (value) => (value ? new Date(`${value}T23:59:59`).toISOString() : null)

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

  const [showDeleted, setShowDeleted] = useState(false)
  const [editDialog, setEditDialog] = useState(false)
  const [editForm, setEditForm] = useState({ plan: 'negosyo', status: 'trial', trial_end_date: '', subscription_end_date: '' })
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [permanentDialog, setPermanentDialog] = useState(false)
  const [confirmName, setConfirmName] = useState('')

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

  const openEdit = (company) => {
    setSelectedCompany(company)
    setEditForm({
      plan: company.subscription_plan || 'negosyo',
      status: company.subscription_status || 'trial',
      trial_end_date: toDateInput(company.trial_end_date),
      subscription_end_date: toDateInput(company.subscription_end_date),
    })
    setEditDialog(true)
  }

  // Shared request runner for edit / delete / restore / permanent delete
  const runCompanyAction = async (company, { path, method, body = undefined, success, onDone = undefined }) => {
    setProcessingId(company.id)
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/admin/subscriptions/${company.id}${path}`, {
        method,
        headers: getAuthHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(success)
        onDone?.()
        fetchSubscriptions()
      } else {
        toast.error(data.error || 'Request failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleSaveEdit = () => {
    if (!selectedCompany) return
    runCompanyAction(selectedCompany, {
      path: '',
      method: 'PUT',
      body: {
        plan: editForm.plan,
        status: editForm.status,
        trial_end_date: fromDateInput(editForm.trial_end_date),
        subscription_end_date: fromDateInput(editForm.subscription_end_date),
      },
      success: `Subscription updated for ${selectedCompany.name}`,
      onDone: () => setEditDialog(false),
    })
  }

  const handleSoftDelete = () => {
    if (!selectedCompany) return
    runCompanyAction(selectedCompany, {
      path: '',
      method: 'DELETE',
      success: `${selectedCompany.name} deleted`,
      onDone: () => setDeleteDialog(false),
    })
  }

  const handleRestore = (company) => {
    runCompanyAction(company, { path: '/restore', method: 'POST', success: `${company.name} restored` })
  }

  const handlePermanentDelete = () => {
    if (!selectedCompany) return
    runCompanyAction(selectedCompany, {
      path: '/permanent',
      method: 'DELETE',
      body: { confirm_name: confirmName },
      success: `${selectedCompany.name} permanently deleted`,
      onDone: () => setPermanentDialog(false),
    })
  }

  const liveCompanies = companies.filter(c => c.is_active !== false)
  const deletedCount = companies.length - liveCompanies.length
  const visibleCompanies = showDeleted ? companies : liveCompanies

  const stats = {
    total: liveCompanies.length,
    active: liveCompanies.filter(c => c.subscription_status === 'active').length,
    trial: liveCompanies.filter(c => c.subscription_status === 'trial').length,
    expired: liveCompanies.filter(c => c.subscription_status === 'expired').length,
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>All Companies</CardTitle>
              {deletedCount > 0 && (
                <div className="flex items-center gap-2">
                  <Switch id="show-deleted" checked={showDeleted} onCheckedChange={setShowDeleted} />
                  <Label htmlFor="show-deleted" className="text-sm text-gray-600 cursor-pointer">
                    Show deleted ({deletedCount})
                  </Label>
                </div>
              )}
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
                    {visibleCompanies.map(company => {
                      const statusCfg = STATUS_CONFIG[company.subscription_status] || STATUS_CONFIG.expired
                      const endDate = company.subscription_status === 'active'
                        ? company.subscription_end_date
                        : company.trial_end_date
                      const isProcessing = processingId === company.id
                      const isDeleted = company.is_active === false

                      return (
                        <TableRow key={company.id} className={isDeleted ? 'opacity-60 bg-gray-50' : ''}>
                          <TableCell className="font-medium">
                            {company.name}
                            {isDeleted && <Badge className="ml-2 bg-gray-200 text-gray-700">Deleted</Badge>}
                          </TableCell>
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
                              {isDeleted ? (
                                <Button size="sm" variant="outline" disabled={isProcessing} onClick={() => handleRestore(company)}>
                                  <RotateCcw className="h-3 w-3 mr-1" /> Restore
                                </Button>
                              ) : (<>
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
                              </>)}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost" disabled={isProcessing} aria-label="More actions">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {!isDeleted && (
                                    <>
                                      <DropdownMenuItem onClick={() => openEdit(company)}>
                                        <Pencil className="h-4 w-4 mr-2" /> Edit subscription
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => { setSelectedCompany(company); setDeleteDialog(true) }}>
                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                    </>
                                  )}
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => { setSelectedCompany(company); setConfirmName(''); setPermanentDialog(true) }}
                                  >
                                    <AlertTriangle className="h-4 w-4 mr-2" /> Delete permanently
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {visibleCompanies.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-400">No companies found</TableCell>
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
        {/* Edit Subscription Dialog */}
        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Subscription</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-gray-600">
                Editing subscription for <strong>{selectedCompany?.name}</strong>
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <Select value={editForm.plan} onValueChange={plan => setEditForm(f => ({ ...f, plan }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="negosyo">Negosyo — ₱299/mo</SelectItem>
                      <SelectItem value="laking-negosyo">Laking Negosyo — ₱599/mo</SelectItem>
                      <SelectItem value="basic">Basic (Legacy)</SelectItem>
                      <SelectItem value="standard">Standard (Legacy)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={status => setEditForm(f => ({ ...f, status }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([value, cfg]) => (
                        <SelectItem key={value} value={value}>{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trial-end">
                    Trial end date {editForm.status === 'trial' && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="trial-end"
                    type="date"
                    value={editForm.trial_end_date}
                    onChange={e => setEditForm(f => ({ ...f, trial_end_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sub-end">
                    Subscription end date {editForm.status === 'active' && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="sub-end"
                    type="date"
                    value={editForm.subscription_end_date}
                    onChange={e => setEditForm(f => ({ ...f, subscription_end_date: e.target.value }))}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Trial uses the trial end date. Active uses the subscription end date. Expired / Suspended locks the client out.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(false)}>Cancel</Button>
              <Button
                onClick={handleSaveEdit}
                disabled={
                  !!processingId ||
                  (editForm.status === 'trial' && !editForm.trial_end_date) ||
                  (editForm.status === 'active' && !editForm.subscription_end_date)
                }
              >
                <CheckCircle className="h-4 w-4 mr-2" /> Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Soft Delete Dialog */}
        <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Company</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2 text-sm text-gray-600">
              <p>Delete <strong>{selectedCompany?.name}</strong>?</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>The owner and staff can no longer log in</li>
                <li>It is hidden from this list (turn on "Show deleted" to see it)</li>
                <li>All data (sales, products, BIR records) is kept and can be restored</li>
              </ul>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleSoftDelete} disabled={!!processingId}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Permanent Delete Dialog */}
        <Dialog open={permanentDialog} onOpenChange={setPermanentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Permanently Delete Company
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2 text-sm">
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-red-800">
                This permanently removes <strong>{selectedCompany?.name}</strong> and <strong>all</strong> of its data:
                stores, products, sales, receipts, Z-readings, staff, attendance, and user accounts.
                <strong> This cannot be undone.</strong>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-name">
                  Type <strong className="select-all">{selectedCompany?.name}</strong> to confirm
                </Label>
                <Input
                  id="confirm-name"
                  value={confirmName}
                  onChange={e => setConfirmName(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPermanentDialog(false)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={handlePermanentDelete}
                disabled={!!processingId || confirmName !== selectedCompany?.name}
              >
                <AlertTriangle className="h-4 w-4 mr-2" /> Delete Permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
