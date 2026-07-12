import { useState, useEffect } from 'react'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/ui/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { User, Receipt, Loader2, CheckCircle, Eye, EyeOff, Camera, Fingerprint, Lock, Building2 } from 'lucide-react'
import { ImageUpload } from '@/components/ui/image-upload'
import API_CONFIG from '@/config/api'
import { usePlan } from '@/hooks/usePlan'

export default function SettingsPage() {
  const { canUseBiometric } = usePlan()
  const [user, setUser] = useState<any>(null)
  const [company, setCompany] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Account form
  const [avatarUrl, setAvatarUrl] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [accountSaving, setAccountSaving] = useState(false)
  const [accountMsg, setAccountMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Biometric toggle
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [biometricSaving, setBiometricSaving] = useState(false)
  const [biometricMsg, setBiometricMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Company form
  const [companyName, setCompanyName] = useState('')
  const [companyTin, setCompanyTin] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [companyPhone, setCompanyPhone] = useState('')
  const [companySaving, setCompanySaving] = useState(false)
  const [companyMsg, setCompanyMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Receipt form
  const [receiptHeader, setReceiptHeader] = useState('')
  const [receiptFooter, setReceiptFooter] = useState('')
  const [showAddress, setShowAddress] = useState(true)
  const [showCashier, setShowCashier] = useState(true)
  const [receiptSaving, setReceiptSaving] = useState(false)
  const [receiptMsg, setReceiptMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    'Content-Type': 'application/json'
  })

  useEffect(() => {
    const userData = localStorage.getItem('userData')
    const companyData = localStorage.getItem('companyData')
    if (userData) setUser(JSON.parse(userData))
    if (companyData) setCompany(JSON.parse(companyData))
    fetchSettings()
    fetchCompany()
  }, [])

  const fetchCompany = async () => {
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/client/company`, { headers: getHeaders() })
      const data = await res.json()
      if (data.company) {
        setCompanyName(data.company.name || '')
        setCompanyTin(data.company.tax_id || '')
        setCompanyAddress(data.company.address || '')
        setCompanyPhone(data.company.phone || '')
        // Keep localStorage in sync
        const stored = localStorage.getItem('companyData')
        const parsed = stored ? JSON.parse(stored) : {}
        localStorage.setItem('companyData', JSON.stringify({ ...parsed, ...data.company }))
      }
    } catch { /* silent */ }
  }

  const saveCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setCompanyMsg(null)
    if (!companyName.trim()) { setCompanyMsg({ type: 'error', text: 'Business name is required' }); return }
    setCompanySaving(true)
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/client/company`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ name: companyName, tax_id: companyTin, address: companyAddress, phone: companyPhone })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      setCompanyMsg({ type: 'success', text: 'Company information updated' })
      // Sync localStorage so receipt print picks up updated TIN
      const stored = localStorage.getItem('companyData')
      const parsed = stored ? JSON.parse(stored) : {}
      localStorage.setItem('companyData', JSON.stringify({ ...parsed, name: companyName, tax_id: companyTin, address: companyAddress, phone: companyPhone }))
    } catch (err: any) {
      setCompanyMsg({ type: 'error', text: err.message })
    } finally {
      setCompanySaving(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/client/settings`, { headers: getHeaders() })
      const data = await res.json()
      if (data.user) {
        setName(data.user.name || '')
        setEmail(data.user.email || '')
        setAvatarUrl(data.user.avatar_url || '')
      }
      if (data.receipt) {
        setReceiptHeader(data.receipt.header || '')
        setReceiptFooter(data.receipt.footer || '')
        setShowAddress(data.receipt.show_address ?? true)
        setShowCashier(data.receipt.show_cashier ?? true)
      }
      setBiometricEnabled(data.biometric_enabled === true)
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setAccountMsg(null)

    if (newPassword && newPassword !== confirmPassword) {
      setAccountMsg({ type: 'error', text: 'New passwords do not match' })
      return
    }
    if (newPassword && newPassword.length < 6) {
      setAccountMsg({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    setAccountSaving(true)
    try {
      const body: any = { name, email, avatar_url: avatarUrl || null }
      if (newPassword) { body.current_password = currentPassword; body.new_password = newPassword }

      const res = await fetch(`${API_CONFIG.BASE_URL}/client/settings/account`, {
        method: 'PUT', headers: getHeaders(), body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')

      setAccountMsg({ type: 'success', text: 'Account updated successfully' })
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')

      // Update localStorage and notify other components
      const stored = localStorage.getItem('userData')
      if (stored) {
        const parsed = JSON.parse(stored)
        localStorage.setItem('userData', JSON.stringify({ ...parsed, name, email, avatar_url: avatarUrl || null }))
        window.dispatchEvent(new Event('storage'))
      }
    } catch (err: any) {
      setAccountMsg({ type: 'error', text: err.message })
    } finally {
      setAccountSaving(false)
    }
  }

  const saveReceipt = async (e: React.FormEvent) => {
    e.preventDefault()
    setReceiptMsg(null)
    setReceiptSaving(true)
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/client/settings/receipt`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ header: receiptHeader, footer: receiptFooter, show_address: showAddress, show_cashier: showCashier })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      setReceiptMsg({ type: 'success', text: 'Receipt settings saved' })
    } catch (err: any) {
      setReceiptMsg({ type: 'error', text: err.message })
    } finally {
      setReceiptSaving(false)
    }
  }

  const toggleBiometric = async (enabled: boolean) => {
    setBiometricMsg(null)
    setBiometricSaving(true)
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/client/settings/biometric`, {
        method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ enabled })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      setBiometricEnabled(enabled)
      setBiometricMsg({ type: 'success', text: `Biometric clock-in ${enabled ? 'enabled' : 'disabled'}` })
    } catch (err: any) {
      setBiometricMsg({ type: 'error', text: err.message })
    } finally {
      setBiometricSaving(false)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar userType="client" user={user} company={company} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b overflow-hidden">
          <div className="flex items-center gap-2 px-4 shrink-0">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Settings</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 max-w-2xl">
          <div>
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your account and receipt preferences</p>
          </div>

          <Tabs defaultValue="account">
            <TabsList className="mb-4">
              <TabsTrigger value="account" className="gap-2">
                <User className="h-4 w-4" /> Account
              </TabsTrigger>
              <TabsTrigger value="company" className="gap-2">
                <Building2 className="h-4 w-4" /> Company
              </TabsTrigger>
              <TabsTrigger value="receipt" className="gap-2">
                <Receipt className="h-4 w-4" /> Receipt
              </TabsTrigger>
              <TabsTrigger value="features" className="gap-2">
                <Fingerprint className="h-4 w-4" /> Features
              </TabsTrigger>
            </TabsList>

            {/* Account Tab */}
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Update your name, email, and password</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={saveAccount} className="space-y-4">

                    {/* Profile Picture */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5"><Camera className="h-4 w-4" /> Profile Picture</Label>
                      <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                          <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                            {avatarUrl
                              ? <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                              : <span className="text-2xl font-bold text-gray-400 select-none">
                                  {name ? name.charAt(0).toUpperCase() : <User className="h-8 w-8 text-gray-300" />}
                                </span>
                            }
                          </div>
                        </div>
                        <div className="flex-1">
                          <ImageUpload
                            value={avatarUrl}
                            onChange={url => setAvatarUrl(url)}
                            disabled={accountSaving}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
                    </div>

                    <Separator />
                    <p className="text-sm font-medium text-gray-700">Change Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span></p>

                    <div className="space-y-2">
                      <Label>Current Password</Label>
                      <div className="relative">
                        <Input
                          type={showCurrentPw ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={e => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          className="pr-10"
                        />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowCurrentPw(!showCurrentPw)}>
                          {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <div className="relative">
                        <Input
                          type={showNewPw ? 'text' : 'password'}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="pr-10"
                        />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowNewPw(!showNewPw)}>
                          {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm New Password</Label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                      />
                    </div>

                    {accountMsg && (
                      <Alert variant={accountMsg.type === 'error' ? 'destructive' : 'default'} className={accountMsg.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : ''}>
                        {accountMsg.type === 'success' && <CheckCircle className="h-4 w-4" />}
                        <AlertDescription>{accountMsg.text}</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" disabled={accountSaving} className="w-full">
                      {accountSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Save Account'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Company Tab */}
            <TabsContent value="company">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>Your business details — shown on official receipts</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={saveCompany} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Business Name</Label>
                      <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Your Business Name" required />
                    </div>
                    <div className="space-y-2">
                      <Label>TIN (Tax Identification Number)</Label>
                      <Input value={companyTin} onChange={e => setCompanyTin(e.target.value)} placeholder="000-000-000-000" />
                      <p className="text-xs text-gray-400">Required for BIR-compliant official receipts</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Business Address</Label>
                      <Textarea value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} placeholder="Street, City, Province" rows={2} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} placeholder="+63 912 345 6789" />
                    </div>
                    {companyMsg && (
                      <Alert variant={companyMsg.type === 'error' ? 'destructive' : 'default'} className={companyMsg.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : ''}>
                        {companyMsg.type === 'success' && <CheckCircle className="h-4 w-4" />}
                        <AlertDescription>{companyMsg.text}</AlertDescription>
                      </Alert>
                    )}
                    <Button type="submit" disabled={companySaving} className="w-full">
                      {companySaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Save Company Info'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Receipt Tab */}
            <TabsContent value="receipt">
              <Card>
                <CardHeader>
                  <CardTitle>Receipt Settings</CardTitle>
                  <CardDescription>Customize what appears on printed receipts</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={saveReceipt} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Receipt Header</Label>
                      <Textarea
                        value={receiptHeader}
                        onChange={e => setReceiptHeader(e.target.value)}
                        placeholder="e.g. Thank you for shopping with us!"
                        rows={2}
                      />
                      <p className="text-xs text-gray-400">Shown at the top of every receipt</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Receipt Footer</Label>
                      <Textarea
                        value={receiptFooter}
                        onChange={e => setReceiptFooter(e.target.value)}
                        placeholder="e.g. Please come again! Follow us on Facebook."
                        rows={2}
                      />
                      <p className="text-xs text-gray-400">Shown at the bottom of every receipt</p>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Show Store Address</p>
                          <p className="text-xs text-gray-400">Print store address on receipt</p>
                        </div>
                        <Switch checked={showAddress} onCheckedChange={setShowAddress} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Show Cashier Name</p>
                          <p className="text-xs text-gray-400">Print staff name on receipt</p>
                        </div>
                        <Switch checked={showCashier} onCheckedChange={setShowCashier} />
                      </div>
                    </div>

                    {receiptMsg && (
                      <Alert variant={receiptMsg.type === 'error' ? 'destructive' : 'default'} className={receiptMsg.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : ''}>
                        {receiptMsg.type === 'success' && <CheckCircle className="h-4 w-4" />}
                        <AlertDescription>{receiptMsg.text}</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" disabled={receiptSaving} className="w-full">
                      {receiptSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Save Receipt Settings'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            {/* Features Tab */}
            <TabsContent value="features">
              <Card>
                <CardHeader>
                  <CardTitle>Staff Features</CardTitle>
                  <CardDescription>Control which features are available to your staff</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Biometric Clock-In Toggle */}
                  <div className={`rounded-xl border p-4 ${canUseBiometric ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${canUseBiometric ? 'bg-blue-50' : 'bg-gray-100'}`}>
                          {canUseBiometric
                            ? <Fingerprint className="h-5 w-5 text-blue-600" />
                            : <Lock className="h-5 w-5 text-gray-400" />}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${canUseBiometric ? 'text-gray-800' : 'text-gray-400'}`}>
                            Biometric Clock-In
                          </p>
                          <p className={`text-xs mt-0.5 ${canUseBiometric ? 'text-gray-500' : 'text-gray-400'}`}>
                            {canUseBiometric
                              ? 'Allow staff to use fingerprint or face ID when clocking in and out'
                              : 'Available on Laking Negosyo plan. Upgrade to unlock this feature.'}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={biometricEnabled}
                        onCheckedChange={toggleBiometric}
                        disabled={!canUseBiometric || biometricSaving}
                      />
                    </div>
                    {biometricMsg && (
                      <Alert variant={biometricMsg.type === 'error' ? 'destructive' : 'default'} className={`mt-3 ${biometricMsg.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : ''}`}>
                        {biometricMsg.type === 'success' && <CheckCircle className="h-4 w-4" />}
                        <AlertDescription>{biometricMsg.text}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
