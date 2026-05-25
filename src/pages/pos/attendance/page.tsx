import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApiClient } from '@/hooks/useApiClient'
import { useAuth } from '@/components/auth/AuthProvider'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  Clock, LogIn, LogOut, Fingerprint, ArrowLeft, CheckCircle,
  AlertCircle, Loader2, CalendarDays, Timer, ShieldCheck, Lock,
} from 'lucide-react'
import {
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser'

type AttendanceRecord = {
  id: string
  clock_in: string
  clock_out: string | null
  total_minutes: number | null
  verified_with_biometric: boolean
  notes: string | null
}

type ActiveShift = {
  id: string
  clock_in: string
  verified_with_biometric: boolean
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-PH', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
}

function ElapsedTimer({ clockIn }: { clockIn: string }) {
  const [elapsed, setElapsed] = useState('')
  useEffect(() => {
    const tick = () => {
      const diff = Math.round((Date.now() - new Date(clockIn).getTime()) / 60000)
      setElapsed(formatDuration(diff))
    }
    tick()
    const t = setInterval(tick, 30000)
    return () => clearInterval(t)
  }, [clockIn])
  return <span>{elapsed}</span>
}

export default function StaffAttendancePage() {
  const { get, post } = useApiClient()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [activeShift, setActiveShift] = useState<ActiveShift | null>(null)
  const [history, setHistory] = useState<AttendanceRecord[]>([])
  const [hasCredential, setHasCredential] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [biometricRestricted, setBiometricRestricted] = useState(false)
  const [enrollDialog, setEnrollDialog] = useState(false)
  const [enrollLoading, setEnrollLoading] = useState(false)
  const [enrollError, setEnrollError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const t = Date.now()
    const [statusRes, historyRes, settingsRes] = await Promise.all([
      get(`/pos/attendance/status?_=${t}`),
      get(`/pos/attendance/my?limit=20&_=${t}`),
      get(`/pos/company-settings?_=${t}`),
    ])
    if (statusRes?.success) {
      setActiveShift(statusRes.data.active_shift)
    }
    if (historyRes?.success) {
      setHistory(historyRes.data.attendance || [])
    }
    if (settingsRes?.success) {
      const enabled = settingsRes.data.biometric_enabled === true
      setBiometricRestricted(!enabled)
      if (enabled) {
        // Only fetch devices if biometric is enabled
        const devicesRes = await get(`/pos/webauthn/devices?_=${t}`)
        if (devicesRes?.success) {
          setHasCredential((devicesRes.data.devices || []).length > 0)
        }
      }
    } else {
      setBiometricRestricted(true)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const clearMessages = () => { setError(''); setSuccessMsg('') }

  // ── Biometric verify helper ──────────────────────────────────────────────
  const biometricVerify = async (): Promise<boolean> => {
    const optRes = await get('/pos/webauthn/auth/options')
    if (!optRes?.success) {
      if (optRes?.error?.includes('No biometric') || optRes?.error?.includes('NO_CREDENTIALS')) {
        setEnrollDialog(true)
        return false
      }
      throw new Error(optRes?.error || 'Failed to get auth options')
    }
    const assertion = await startAuthentication({ optionsJSON: optRes.data })
    const verifyRes = await post('/pos/webauthn/auth/verify', { credential: assertion })
    if (!verifyRes?.success || !verifyRes.data?.verified) {
      throw new Error('Biometric verification failed')
    }
    return true
  }

  // ── Clock In ────────────────────────────────────────────────────────────
  const handleClockIn = async (withBiometric: boolean) => {
    clearMessages()
    setActionLoading(true)
    try {
      let verified = false
      if (withBiometric) {
        verified = await biometricVerify()
        if (!verified) { setActionLoading(false); return }
      }
      const res = await post('/pos/attendance/clock-in', { verified_with_biometric: verified })
      if (res?.success) {
        setSuccessMsg('Clocked in successfully!')
      } else {
        setError(res?.error || 'Failed to clock in')
      }
      await load()
    } catch (e: any) {
      setError(e.message || 'Biometric failed. Try again.')
    }
    setActionLoading(false)
  }

  // ── Clock Out ───────────────────────────────────────────────────────────
  const handleClockOut = async (withBiometric: boolean) => {
    clearMessages()
    setActionLoading(true)
    try {
      let verified = false
      if (withBiometric) {
        verified = await biometricVerify()
        if (!verified) { setActionLoading(false); return }
      }
      const res = await post('/pos/attendance/clock-out', { verified_with_biometric: verified })
      if (res?.success) {
        const mins = res.data.attendance?.total_minutes
        setSuccessMsg(`Clocked out! Shift duration: ${mins != null ? formatDuration(mins) : '—'}`)
      } else {
        setError(res?.error || 'Failed to clock out')
      }
      await load()
    } catch (e: any) {
      setError(e.message || 'Biometric failed. Try again.')
    }
    setActionLoading(false)
  }

  // ── Enroll Biometric ────────────────────────────────────────────────────
  const handleEnroll = async () => {
    setEnrollError('')
    setEnrollLoading(true)
    try {
      const optRes = await get('/pos/webauthn/register/options')
      if (!optRes?.success) throw new Error(optRes?.error || 'Failed to get options')
      const credential = await startRegistration({ optionsJSON: optRes.data })
      const verifyRes = await post('/pos/webauthn/register/verify', {
        credential,
        device_name: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop / Tablet',
      })
      if (!verifyRes?.success) throw new Error(verifyRes?.error || 'Registration failed')
      setHasCredential(true)
      setEnrollDialog(false)
      setSuccessMsg('Biometric registered! You can now use fingerprint/face to clock in.')
    } catch (e: any) {
      setEnrollError(e.message || 'Biometric enrollment failed. Make sure your device supports it.')
    }
    setEnrollLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E8302A]" />
      </div>
    )
  }

  const staffName = user?.name || 'Staff'

  return (
    <div className="min-h-screen bg-gray-50 pb-28 md:pb-8">
      {/* Header */}
      <div className="bg-[#E8302A] text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-white/20 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-lg leading-tight">Attendance</h1>
          <p className="text-red-100 text-xs">{staffName}</p>
        </div>
        {hasCredential && !biometricRestricted && (
          <div className="flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Biometric</span>
          </div>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">
        {/* Feedback messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {successMsg && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{successMsg}</AlertDescription>
          </Alert>
        )}

        {/* Active shift card */}
        {activeShift ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-semibold text-green-800">Shift in progress</span>
              {activeShift.verified_with_biometric && (
                <Badge variant="outline" className="text-[10px] border-green-400 text-green-700 gap-1">
                  <Fingerprint className="h-3 w-3" /> Biometric
                </Badge>
              )}
            </div>
            <p className="text-xs text-green-600 mb-3">
              Started at {formatTime(activeShift.clock_in)} · <ElapsedTimer clockIn={activeShift.clock_in} /> elapsed
            </p>
            <div className="flex gap-2">
              {hasCredential && !biometricRestricted && (
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
                  onClick={() => handleClockOut(true)}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
                  Clock Out + Biometric
                </Button>
              )}
              <Button
                variant="outline"
                className={hasCredential && !biometricRestricted ? '' : 'flex-1'}
                onClick={() => handleClockOut(false)}
                disabled={actionLoading}
              >
                {actionLoading && (!hasCredential || biometricRestricted) ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <LogOut className="h-4 w-4 mr-1" />}
                Clock Out
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">Not clocked in</span>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              {new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <div className="flex gap-2">
              {hasCredential && !biometricRestricted && (
                <Button
                  className="flex-1 bg-[#E8302A] hover:bg-[#B91C1C] text-white gap-2"
                  onClick={() => handleClockIn(true)}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
                  Clock In + Biometric
                </Button>
              )}
              <Button
                variant={hasCredential && !biometricRestricted ? 'outline' : 'default'}
                className={!hasCredential || biometricRestricted ? 'flex-1 bg-[#E8302A] hover:bg-[#B91C1C] text-white' : ''}
                onClick={() => handleClockIn(false)}
                disabled={actionLoading}
              >
                {actionLoading && (!hasCredential || biometricRestricted) ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <LogIn className="h-4 w-4 mr-1" />}
                Clock In
              </Button>
            </div>
          </div>
        )}

        {/* Enroll biometric banner */}
        {biometricRestricted ? (
          <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <Lock className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Biometric clock-in disabled</p>
              <p className="text-xs text-gray-400">Your manager has not enabled biometric clock-in. Ask them to turn it on in Settings.</p>
            </div>
          </div>
        ) : !hasCredential && (
          <button
            onClick={() => setEnrollDialog(true)}
            className="w-full bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center gap-3 text-left hover:bg-blue-100 transition-colors"
          >
            <Fingerprint className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800">Set up biometric clock-in</p>
              <p className="text-xs text-blue-600">Use fingerprint or face ID for faster, verified attendance</p>
            </div>
          </button>
        )}

        {/* Attendance history */}
        <div>
          <h2 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" /> Recent Attendance
          </h2>
          {history.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No attendance records yet</p>
          ) : (
            <div className="space-y-2">
              {history.map(record => (
                <div key={record.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {formatDateTime(record.clock_in)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {record.clock_out
                          ? `Out: ${formatTime(record.clock_out)}`
                          : <span className="text-green-600 font-medium">Active</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {record.verified_with_biometric && (
                        <Fingerprint className="h-3.5 w-3.5 text-blue-500" />
                      )}
                      {record.total_minutes != null && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Timer className="h-3.5 w-3.5" />
                          {formatDuration(record.total_minutes)}
                        </div>
                      )}
                      {!record.clock_out && (
                        <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Enroll Biometric Dialog */}
      <Dialog open={enrollDialog} onOpenChange={setEnrollDialog}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-blue-600" />
              Set Up Biometric
            </DialogTitle>
            <DialogDescription>
              Register your fingerprint or face ID to enable verified clock-in/out on this device.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {enrollError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{enrollError}</AlertDescription>
              </Alert>
            )}
            <ul className="text-sm text-gray-600 space-y-1.5">
              <li>• Your biometric data never leaves your device</li>
              <li>• Works with fingerprint, face ID, or PIN (device fallback)</li>
              <li>• You can remove it anytime from this page</li>
            </ul>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setEnrollDialog(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2"
                onClick={handleEnroll}
                disabled={enrollLoading}
              >
                {enrollLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
                Enroll Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
