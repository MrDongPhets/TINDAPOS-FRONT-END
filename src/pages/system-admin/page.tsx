// src/app/system-admin/page.jsx - Fixed hardcoded localhost

import { useState, useEffect } from "react"
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Shield, Crown, Lock, Wifi, WifiOff } from "lucide-react"
import API_CONFIG from "@/config/api"
import { useAuth } from "@/components/auth/AuthProvider"

export default function SystemAdminLogin() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isOnline, setIsOnline] = useState(true)
  
  // Super admin login state
  const [credentials, setCredentials] = useState({
    email: "",
    password: ""
  })

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userType = localStorage.getItem('userType')
    
    if (token && userType === 'super_admin') {
      navigate('/admin/dashboard')
    }
  }, [navigate])

  // FIXED: Monitor connection using correct API URL
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/health`)
        setIsOnline(response.ok)
      } catch {
        setIsOnline(false)
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleSuperAdminLogin = async () => {
    setError("")

    if (!credentials.email || !credentials.password) {
      setError("Please enter both email and password")
      return
    }

    setLoading(true)
    try {
      const result = await login(credentials, 'super_admin')
      if (!result.success) {
        setError(result.error || "Invalid admin credentials. Access denied.")
      }
      // On success, AuthProvider sets isAuthenticated=true and route protection redirects
    } catch (err) {
      setError("Unable to connect to server. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  const fillDemoAdmin = () => {
    setCredentials({
      email: "admin@system.com",
      password: "superadmin123"
    })
    setError("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex flex-col items-center justify-center p-4">
      {/* Connection Status */}
      <div className="fixed top-4 right-4 z-50">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
          isOnline 
            ? 'bg-green-900 text-green-100' 
            : 'bg-red-900 text-red-100'
        }`}>
          {isOnline ? (
            <>
              <Wifi className="h-3 w-3" />
              <span>System Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              <span>System Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Warning Notice */}
      <div className="w-full max-w-md mb-6">
        <Alert className="bg-red-900 border-red-700">
          <Lock className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-100">
            <strong>Restricted Access</strong> - This area is for authorized system administrators only. 
            All access attempts are logged and monitored.
          </AlertDescription>
        </Alert>
      </div>

      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">System Administration</h1>
        <p className="text-purple-200">Secure access portal for system administrators</p>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl text-center text-white flex items-center justify-center gap-2">
            <Crown className="h-5 w-5 text-purple-400" />
            Administrator Access
          </CardTitle>
          <CardDescription className="text-center text-gray-300">
            Enter your system administrator credentials
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="text-center p-3 bg-purple-900/50 rounded-lg mb-6 border border-purple-800">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-purple-400" />
              <span className="font-medium text-purple-100">System Administrator</span>
              <Badge variant="secondary" className="bg-purple-800 text-purple-100 border-purple-700">
                Super Admin
              </Badge>
            </div>
            <p className="text-sm text-purple-300">
              Full system access and platform management
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="admin-email" className="text-sm font-medium text-gray-300">
                Administrator Email
              </label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@system.com"
                value={credentials.email}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  email: e.target.value
                }))}
                disabled={loading}
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="admin-password" className="text-sm font-medium text-gray-300">
                Administrator Password
              </label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Enter secure password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  password: e.target.value
                }))}
                disabled={loading}
                onKeyPress={(e) => e.key === 'Enter' && handleSuperAdminLogin()}
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              />
            </div>

            <Button 
              onClick={handleSuperAdminLogin}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              disabled={loading || !isOnline}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Access System
                </>
              )}
            </Button>

            {/* Demo Admin - Only show in development */}
            {import.meta.env.DEV && (
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={fillDemoAdmin}
                  className="text-sm text-purple-400 hover:text-purple-300"
                  disabled={loading}
                >
                  Use Demo Admin (Dev Only)
                </Button>
              </div>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <Alert className="bg-red-900 border-red-700 mt-4">
              <AlertDescription className="text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">
          System Administration Portal | Secured Access
        </p>
        <p className="text-xs text-gray-500 mt-1">
          API: {API_CONFIG.BASE_URL} | {isOnline ? 'System operational' : 'System maintenance'}
        </p>
      </div>
    </div>
  )
}