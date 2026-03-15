import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Building2, User, CheckCircle2, ChevronRight } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import API_CONFIG from '@/config/api'

const STEPS = ['Company Info', 'Admin Account', 'Confirm']

function SetupWizard() {
  const { completeSetup } = useAuth()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    companyName: '',
    adminName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const validateStep = () => {
    setError('')
    if (step === 0) {
      if (!form.companyName.trim()) {
        setError('Company name is required.')
        return false
      }
    }
    if (step === 1) {
      if (!form.adminName.trim() || !form.email.trim() || !form.password) {
        setError('All fields are required.')
        return false
      }
      if (form.password.length < 6) {
        setError('Password must be at least 6 characters.')
        return false
      }
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match.')
        return false
      }
    }
    return true
  }

  const next = () => {
    if (validateStep()) setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/setup/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: form.companyName.trim(),
          adminName: form.adminName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Setup failed. Please try again.')
        return
      }
      // Auto-login: delegate to AuthProvider
      completeSetup(data)
    } catch {
      setError('Connection error. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#E8302A] rounded-xl flex items-center justify-center mx-auto mb-4">
          <Building2 className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">TindaPOS Setup</h1>
        <p className="text-gray-500 mt-1">Offline mode — first-time configuration</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold ${
              i < step ? 'bg-[#E8302A] text-white' :
              i === step ? 'bg-[#FFF1F0] text-[#E8302A] border-2 border-[#E8302A]' :
              'bg-gray-100 text-gray-400'
            }`}>
              {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-sm ${i === step ? 'text-[#E8302A] font-medium' : 'text-gray-400'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-gray-300" />}
          </div>
        ))}
      </div>

      <Card className="w-full max-w-md">
        {/* Step 0: Company Info */}
        {step === 0 && (
          <>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>What is your business called?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Company Name</label>
                <Input
                  placeholder="e.g. Warung Kopi Jaya"
                  value={form.companyName}
                  onChange={e => update('companyName', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && next()}
                  autoFocus
                />
              </div>
              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}
              <Button className="w-full" onClick={next}>
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </>
        )}

        {/* Step 1: Admin Account */}
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle>Admin Account</CardTitle>
              <CardDescription>Create the owner / manager account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  placeholder="e.g. Ahmad Wijaya"
                  value={form.adminName}
                  onChange={e => update('adminName', e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="admin@yourcompany.com"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={e => update('confirmPassword', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && next()}
                />
              </div>
              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setError(''); setStep(0) }}>
                  Back
                </Button>
                <Button className="flex-1" onClick={next}>
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {/* Step 2: Confirm */}
        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle>Confirm Setup</CardTitle>
              <CardDescription>Review your details before finishing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3 bg-gray-50">
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Company</p>
                    <p className="font-medium">{form.companyName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Admin</p>
                    <p className="font-medium">{form.adminName}</p>
                    <p className="text-sm text-gray-500">{form.email}</p>
                  </div>
                </div>
              </div>

              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setError(''); setStep(1) }} disabled={loading}>
                  Back
                </Button>
                <Button className="flex-1 bg-[#E8302A] hover:bg-[#B91C1C]" onClick={handleSubmit} disabled={loading}>
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting up...</>
                  ) : (
                    <><CheckCircle2 className="mr-2 h-4 w-4" /> Finish Setup</>
                  )}
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>

      <p className="text-xs text-gray-400 mt-6">TindaPOS Offline Mode</p>
    </div>
  )
}

export default function SetupPage() {
  return <SetupWizard />
}
