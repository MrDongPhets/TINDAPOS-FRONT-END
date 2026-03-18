// src/app/login/page.jsx - Fixed hardcoded localhost

import { useState, useEffect } from "react"
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, LogIn, Building2, WifiOff, AlertTriangle, User, LogOut, Users, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/components/auth/AuthProvider"
import API_CONFIG from "@/config/api"
import { Capacitor } from "@capacitor/core"

// True when running inside Electron, Capacitor (Android/iOS), or PWA
const isNativeApp = Capacitor.isNativePlatform()
  || navigator.userAgent.includes('Electron')
  || window.matchMedia('(display-mode: standalone)').matches

function LoginForm() {
  const { login, loginWithToken, loading: authLoading, isAuthenticated, user, userType, logout } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isOnline, setIsOnline] = useState(true)
  const [successMessage, setSuccessMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('remember_me') === 'true')

  // Client login state — pre-fill email if remembered
  const [credentials, setCredentials] = useState({
    email: localStorage.getItem('remember_me') === 'true' ? (localStorage.getItem('remembered_email') || "") : "",
    password: ""
  })

  // Handle Google OAuth redirect (token in URL) and success messages
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')
    const message = urlParams.get('message')
    const googleError = urlParams.get('error')

    if (token) {
      window.history.replaceState({}, '', '/login')
      loginWithToken(token).then((result: { success: boolean; error?: string }) => {
        if (!result.success) setError(result.error || 'Google login failed')
      })
      return
    }

    if (message) {
      setSuccessMessage(message)
      window.history.replaceState({}, '', '/login')
    }

    if (googleError) {
      const messages: Record<string, string> = {
        google_cancelled: 'Google sign-in was cancelled.',
        google_token_failed: 'Google sign-in failed. Please try again.',
        google_error: 'An error occurred with Google sign-in.',
      }
      setError(messages[googleError] || 'Google sign-in failed.')
      window.history.replaceState({}, '', '/login')
    }
  }, [loginWithToken])

  // Monitor connection — 8s timeout to handle Render.com cold starts gracefully
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 8000)
        const response = await fetch(`${API_CONFIG.BASE_URL}/health`, { signal: controller.signal })
        clearTimeout(timeout)
        setIsOnline(response.ok)
      } catch {
        // Keep previous isOnline state on timeout — don't flash offline on slow server wake
        // Only set offline on a hard network failure (no connection at all)
        if (!navigator.onLine) setIsOnline(false)
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleLogin = async () => {
    setError("")
    setSuccessMessage("")
    setLoading(true)

    try {
      if (!credentials.email || !credentials.password) {
        setError("Please enter both email and password")
        return
      }

      const result = await login(credentials, 'client')

      if (!result.success) {
        setError(result.error || "Login failed. Please try again.")
      } else {
        if (rememberMe) {
          localStorage.setItem('remember_me', 'true')
          localStorage.setItem('remembered_email', credentials.email)
        } else {
          localStorage.removeItem('remember_me')
          localStorage.removeItem('remembered_email')
        }
      }
      // Success handling is done by AuthProvider (automatic redirect)

    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Show loading if auth is still initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#E8302A]" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading...</h2>
            <p className="text-gray-600">Initializing application</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show session warning if already authenticated
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        {/* Connection Status — only show when offline */}
        {!isOnline && (
          <div className="fixed top-4 right-4 z-50">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-red-100 text-red-700">
              <WifiOff className="h-3 w-3" />
              <span>Offline</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <img src="/logo.png" alt="TindaPOS" className="w-16 h-16 mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-gray-900">TindaPOS</h1>
          <p className="text-gray-600">Ang POS para sa bawat tindahan.</p>
        </div>

        {/* Session Warning Card */}
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-xl">Already Logged In</CardTitle>
            <CardDescription>
              You are currently logged in as a {userType === 'super_admin' ? 'System Administrator' : 'Business User'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Alert className="bg-orange-50 border-orange-200 mb-6">
              <User className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Current Session:</strong> {user?.name} ({user?.email})
                <br />
                <span className="text-sm">User Type: {userType === 'super_admin' ? 'System Administrator' : 'Business User'}</span>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Button 
                onClick={() => {
                  if (userType === 'super_admin') {
                    navigate('/admin/dashboard')
                  } else {
                    navigate('/client/dashboard')
                  }
                }}
                className="w-full bg-[#E8302A] hover:bg-[#B91C1C]"
              >
                <User className="mr-2 h-4 w-4" />
                Go to My Dashboard
              </Button>

              <Button 
                onClick={logout}
                variant="outline"
                className="w-full border-red-200 text-red-700 hover:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout and Switch Account
              </Button>
            </div>

            <div className="text-center text-xs text-gray-500 mt-6 pt-4 border-t">
              <p>To login with a different account, please logout first.</p>
              <p>This prevents unauthorized access to other accounts.</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            TindaPOS v2.0.0 · © 2026 Mustard Digitals
          </p>
          {/* <p className="text-xs text-gray-400 mt-1">
            Secure session active • API: {API_CONFIG.BASE_URL}
          </p> */}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Connection Status — only show when offline */}
      {!isOnline && (
        <div className="fixed top-4 right-4 z-50">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-red-100 text-red-700">
            <WifiOff className="h-3 w-3" />
            <span>Offline</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <img src="/logo.png" alt="TindaPOS" className="w-16 h-16 mx-auto mb-4 object-contain" />
        <h1 className="text-2xl font-bold text-gray-900">TindaPOS</h1>
        <p className="text-gray-600">Ang POS para sa bawat tindahan.</p>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            Enter your business account credentials
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="text-center p-3 bg-[#FFF1F0] rounded-lg mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Building2 className="h-5 w-5 text-[#E8302A]" />
              <span className="font-medium text-[#1A1A2E]">Business Account</span>
            </div>
            <p className="text-sm text-[#B91C1C]">
              For company owners, managers, and staff members
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Business Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="manager@yourcompany.com"
                value={credentials.email}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  email: e.target.value
                }))}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-[#E8302A] hover:text-[#B91C1C]">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({
                    ...prev,
                    password: e.target.value
                  }))}
                  disabled={loading}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRememberMe(p => !p)}
                className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  rememberMe ? 'bg-[#E8302A] border-[#E8302A]' : 'border-gray-300 bg-white'
                }`}
              >
                {rememberMe && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <label
                onClick={() => setRememberMe(p => !p)}
                className="text-sm text-gray-600 cursor-pointer select-none"
              >
                Remember me
              </label>
            </div>

            <Button
              onClick={handleLogin}
              className="w-full bg-[#E8302A] hover:bg-[#B91C1C]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In to Business
                </>
              )}
            </Button>

            {/* Google Sign-In — web only */}
            {!isNativeApp && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-400">or</span>
                  </div>
                </div>
                <a href={`${API_CONFIG.BASE_URL}/auth/google`}>
                  <Button variant="outline" className="w-full gap-2" type="button">
                    <img src="https://www.google.com/favicon.ico" className="h-4 w-4" alt="" />
                    Continue with Google
                  </Button>
                </a>
              </>
            )}
          </div>

          {/* Success Alert */}
          {successMessage && (
            <Alert className="bg-green-50 border-green-200 mt-4">
              <AlertDescription className="text-green-800">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert className="bg-red-50 border-red-200 mt-4">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Register Link — browser/website only */}
          {!isNativeApp && (
            <div className="text-center text-sm mt-6 pt-4 border-t">
              <span className="text-gray-600">Don't have a business account? </span>
              <Link to="/register" className="text-[#E8302A] hover:text-[#B91C1C] font-medium">
                Start Free Trial
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staff Login Link — visible in Electron, Capacitor (Android/iOS), or PWA */}
      {isNativeApp && (
        <div className="mt-4 w-full max-w-md">
          <Button
            variant="outline"
            className="w-full border-gray-300 text-gray-600 hover:bg-gray-50"
            onClick={() => navigate('/staff/login')}
          >
            <Users className="mr-2 h-4 w-4" />
            Staff / Cashier Login
          </Button>
        </div>
      )}

      {/* Get the App link — browser only */}
      {!isNativeApp && (
        <div className="mt-4 w-full max-w-md text-center">
          <Link to="/download" className="text-sm text-[#E8302A] hover:text-[#B91C1C] font-medium">
            📱 Get the App
          </Link>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          TindaPOS v2.0.0 · © 2026 Mustard Digitals
        </p>
        {/* <p className="text-xs text-gray-400 mt-1">
          API: {API_CONFIG.BASE_URL}
        </p> */}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <LoginForm />
}