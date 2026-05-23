import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApiClient } from '@/hooks/useApiClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, Loader2, Lock, Delete, ArrowLeft } from 'lucide-react'

export default function StaffChangePinPage() {
  const { post } = useApiClient()
  const navigate = useNavigate()

  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [activeField, setActiveField] = useState<'current' | 'new' | 'confirm'>('current')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleNumber = (n: string) => {
    if (activeField === 'current' && currentPin.length < 6) setCurrentPin(p => p + n)
    else if (activeField === 'new' && newPin.length < 6) setNewPin(p => p + n)
    else if (activeField === 'confirm' && confirmPin.length < 6) setConfirmPin(p => p + n)
  }

  const handleBackspace = () => {
    if (activeField === 'current') setCurrentPin(p => p.slice(0, -1))
    else if (activeField === 'new') setNewPin(p => p.slice(0, -1))
    else setConfirmPin(p => p.slice(0, -1))
  }

  const handleClear = () => {
    if (activeField === 'current') setCurrentPin('')
    else if (activeField === 'new') setNewPin('')
    else setConfirmPin('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPin.length < 4) { setError('New PIN must be at least 4 digits'); return }
    if (newPin !== confirmPin) { setError('New PIN and confirmation do not match'); return }
    if (currentPin === newPin) { setError('New PIN must be different from current PIN'); return }

    setSubmitting(true)
    const res = await post('/staff/permissions/change-passcode', {
      current_passcode: currentPin,
      new_passcode: newPin,
    })
    setSubmitting(false)

    if (res?.success) {
      setSuccess('PIN changed successfully!')
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
      setActiveField('current')
    } else {
      setError(res?.error || 'Failed to change PIN')
    }
  }

  const fieldLabel = activeField === 'current' ? 'Current PIN' : activeField === 'new' ? 'New PIN' : 'Confirm PIN'

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
      {/* Header */}
      <div className="bg-[#E8302A] text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-white/20 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-bold text-lg leading-tight">Change PIN</h1>
          <p className="text-red-100 text-xs">Update your login PIN</p>
        </div>
      </div>

      <div className="max-w-sm mx-auto px-4 pt-6 space-y-4">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-[#E8302A]" />
              <CardTitle className="text-base">PIN Update</CardTitle>
            </div>
            <CardDescription>Enter your current PIN and set a new one (4–6 digits)</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Current PIN */}
              <div className="space-y-1.5">
                <Label className="text-sm">Current PIN</Label>
                <Input
                  type="password"
                  inputMode="none"
                  placeholder="• • • •"
                  value={currentPin}
                  readOnly
                  onClick={() => setActiveField('current')}
                  className={`text-center text-2xl tracking-widest cursor-pointer ${
                    activeField === 'current' ? 'ring-2 ring-[#E8302A] border-[#E8302A]' : ''
                  }`}
                  maxLength={6}
                />
              </div>

              {/* New PIN */}
              <div className="space-y-1.5">
                <Label className="text-sm">New PIN (4–6 digits)</Label>
                <Input
                  type="password"
                  inputMode="none"
                  placeholder="• • • •"
                  value={newPin}
                  readOnly
                  onClick={() => setActiveField('new')}
                  className={`text-center text-2xl tracking-widest cursor-pointer ${
                    activeField === 'new' ? 'ring-2 ring-[#E8302A] border-[#E8302A]' : ''
                  }`}
                  maxLength={6}
                />
              </div>

              {/* Confirm PIN */}
              <div className="space-y-1.5">
                <Label className="text-sm">Confirm New PIN</Label>
                <Input
                  type="password"
                  inputMode="none"
                  placeholder="• • • •"
                  value={confirmPin}
                  readOnly
                  onClick={() => setActiveField('confirm')}
                  className={`text-center text-2xl tracking-widest cursor-pointer ${
                    activeField === 'confirm' ? 'ring-2 ring-[#E8302A] border-[#E8302A]' : ''
                  }`}
                  maxLength={6}
                />
              </div>

              {/* Active field indicator */}
              <p className="text-center text-xs text-gray-500">
                Entering: <span className="font-medium text-[#E8302A]">{fieldLabel}</span>
              </p>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                  <Button
                    key={n}
                    type="button"
                    variant="outline"
                    className="h-14 text-lg font-semibold"
                    onClick={() => handleNumber(String(n))}
                  >
                    {n}
                  </Button>
                ))}
                <Button type="button" variant="outline" className="h-14 text-sm" onClick={handleClear}>
                  Clear
                </Button>
                <Button type="button" variant="outline" className="h-14 text-lg font-semibold" onClick={() => handleNumber('0')}>
                  0
                </Button>
                <Button type="button" variant="outline" className="h-14" onClick={handleBackspace}>
                  <Delete className="h-5 w-5" />
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-[#E8302A] hover:bg-[#B91C1C] text-white"
                disabled={submitting || !currentPin || !newPin || !confirmPin || newPin.length < 4}
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Changing...</>
                ) : (
                  'Change PIN'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <h3 className="text-sm font-semibold mb-2">Security Tips</h3>
            <ul className="space-y-1 text-xs text-gray-500">
              <li>• Use a PIN that's easy to remember but hard to guess</li>
              <li>• Avoid obvious PINs like 1234 or your birthday</li>
              <li>• Never share your PIN with anyone</li>
              <li>• All PIN changes are logged for security</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
