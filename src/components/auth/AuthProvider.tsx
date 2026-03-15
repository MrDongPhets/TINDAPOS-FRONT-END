// src/components/auth/AuthProvider.tsx - Updated with Staff support
import logger from '@/utils/logger';

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import API_CONFIG from '@/config/api'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AuthContext = createContext<any>({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userType, setUserType] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [needsSetup, setNeedsSetup] = useState(false)

  const { pathname } = useLocation()
  const navigate = useNavigate()

  // Initialize auth state only once
  useEffect(() => {
    if (!initialized) {
      logger.log('🚀 Initializing auth with API:', API_CONFIG.BASE_URL)
      initializeAuth()
    }
  }, [initialized])

  // Route protection effect - runs after initialization
  useEffect(() => {
    if (initialized && !loading) {
      handleRouteProtection()
    }
  }, [initialized, loading, isAuthenticated, userType, pathname])

  const validateToken = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) return false

    try {
      const userTypeData = localStorage.getItem('userType')
      
      // Different verification endpoints for different user types
      let endpoint = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.VERIFY}`
      if (userTypeData === 'staff') {
        endpoint = `${API_CONFIG.BASE_URL}/staff/auth/verify`
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        return true;
      } else {
        logger.log('Token validation failed:', data.error);
        handleTokenExpiration();
        return false;
      }
    } catch (error) {
      logger.error('Token validation error:', error);
      return false;
    }
  }

  const handleTokenExpiration = useCallback(() => {
    logger.log('🚨 Handling token expiration...')
    
    // Clear local state
    setUser(null)
    setUserType(null)
    setIsAuthenticated(false)
    
    // Clear localStorage
    localStorage.removeItem('authToken')
    localStorage.removeItem('userData')
    localStorage.removeItem('userType')
    localStorage.removeItem('companyData')
    localStorage.removeItem('subscriptionData')
    localStorage.removeItem('staffData')
    
    // Show notification
    if (typeof window !== 'undefined') {
      alert('Your session has expired. Please log in again.')
    }
    
    // Redirect to appropriate login page
    const currentPath = window.location.pathname
    if (currentPath.startsWith('/admin')) {
      navigate('/system-admin')
    } else if (currentPath.startsWith('/pos')) {
      navigate('/staff/login')
    } else {
      navigate('/login')
    }
  }, [])

  const initializeAuth = useCallback(async () => {
    try {
      // Check if first-time setup is needed (SQLite offline mode)
      try {
        const setupRes = await fetch(`${API_CONFIG.BASE_URL}/setup/status`)
        if (setupRes.ok) {
          const setupData = await setupRes.json()
          if (setupData.needsSetup) {
            logger.log('🔧 First-time setup required')
            setNeedsSetup(true)
            setLoading(false)
            setInitialized(true)
            return
          }
        }
      } catch {
        // Backend unreachable or not SQLite mode — continue normal auth
      }

      logger.log('📱 Loading from localStorage...')
      
      const token = localStorage.getItem('authToken')
      const userData = localStorage.getItem('userData')
      const staffData = localStorage.getItem('staffData')
      const userTypeData = localStorage.getItem('userType')
      
      logger.log('Token exists:', !!token)
      logger.log('User type:', userTypeData)
      logger.log('Current pathname:', pathname)
      
      if (token && userTypeData) {
        // Handle staff authentication
        if (userTypeData === 'staff' && staffData) {
          const parsedStaff = JSON.parse(staffData)
          
          logger.log('🔍 Validating staff token...')
          const isValid = await validateToken()
          
          if (isValid) {
            setUser(parsedStaff)
            setUserType('staff')
            setIsAuthenticated(true)
            logger.log('✅ Staff auth restored:', parsedStaff.staff_id)
          } else {
            logger.log('❌ Staff token validation failed')
            localStorage.removeItem('authToken')
            localStorage.removeItem('staffData')
            localStorage.removeItem('userType')
            setUser(null)
            setUserType(null)
            setIsAuthenticated(false)
          }
        } 
        // Handle client/admin authentication
        else if (userData) {
          const parsedUser = JSON.parse(userData)
          
          logger.log('🔍 Validating token with server...')
          const isValid = await validateToken()
          
          if (isValid) {
            setUser(parsedUser)
            setUserType(userTypeData)
            setIsAuthenticated(true)
            logger.log('✅ Auth restored:', parsedUser.email, userTypeData)
          } else {
            logger.log('❌ Token validation failed, clearing session')
            localStorage.removeItem('authToken')
            localStorage.removeItem('userData')
            localStorage.removeItem('userType')
            localStorage.removeItem('companyData')
            localStorage.removeItem('subscriptionData')
            setUser(null)
            setUserType(null)
            setIsAuthenticated(false)
          }
        }
      } else {
        logger.log('❌ No valid auth data found')
        setUser(null)
        setUserType(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      logger.error('❌ Auth initialization error:', error)
      setUser(null)
      setUserType(null)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
      setInitialized(true)
      logger.log('✅ Auth initialization complete')
    }
  }, [pathname])

  const handleRouteProtection = useCallback(() => {
    logger.log('🛡️ Route protection check:', {
      pathname,
      isAuthenticated,
      userType,
      user: user?.email || user?.name
    })

    // If setup is needed, redirect everything to /setup
    if (needsSetup) {
      if (pathname !== '/setup') {
        logger.log('🔧 Redirecting to setup wizard')
        navigate('/setup')
      }
      return
    }

    // Define route types
    const publicRoutes = ['/', '/register']
    const loginRoutes = ['/login', '/system-admin', '/staff/login', '/setup']
    const adminRoutes = ['/admin']
    const clientRoutes = ['/client']
    const posRoutes = ['/pos']

    const isPublicRoute = publicRoutes.includes(pathname)
    const isLoginRoute = loginRoutes.includes(pathname)
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
    const isClientRoute = clientRoutes.some(route => pathname.startsWith(route))
    const isPOSRoute = posRoutes.some(route => pathname.startsWith(route))

    logger.log('Route analysis:', { isPublicRoute, isLoginRoute, isAdminRoute, isClientRoute, isPOSRoute })

    // PREVENT ALREADY AUTHENTICATED USERS FROM ACCESSING LOGIN PAGES
    if (isAuthenticated && isLoginRoute) {
      logger.log('🔒 Already authenticated user trying to access login page')

      if (userType === 'super_admin') {
        navigate('/admin/dashboard')
      } else if (userType === 'client') {
        navigate('/client/dashboard')
      } else if (userType === 'staff') {
        navigate('/pos')
      }
      return
    }

    // If not authenticated and trying to access protected routes
    if (!isAuthenticated && (isAdminRoute || isClientRoute || isPOSRoute)) {
      logger.log('❌ Not authenticated, redirecting to appropriate login')
      if (isAdminRoute) {
        navigate('/system-admin')
      } else if (isPOSRoute) {
        navigate('/staff/login')
      } else {
        navigate('/login')
      }
      return
    }

    // If authenticated, check user type matches route type
    if (isAuthenticated && userType) {
      logger.log('✅ Authenticated user, checking route permissions')

      // Staff can only access POS
      if (userType === 'staff' && !isPOSRoute && !isPublicRoute) {
        logger.log('📄 Staff accessing non-POS route, redirecting to POS')
        navigate('/pos')
        return
      }

      // Super admin trying to access client/POS routes
      if (userType === 'super_admin' && (isClientRoute || isPOSRoute)) {
        logger.log('📄 Super admin redirecting to admin dashboard')
        navigate('/admin/dashboard')
        return
      }

      // Client trying to access admin/POS routes
      if (userType === 'client' && (isAdminRoute || isPOSRoute)) {
        logger.log('📄 Client redirecting to client dashboard')
        navigate('/client/dashboard')
        return
      }

      // Root path redirect
      if (pathname === '/') {
        logger.log('📄 Root path, redirecting based on user type')
        if (userType === 'super_admin') {
          navigate('/admin/dashboard')
        } else if (userType === 'client') {
          navigate('/client/dashboard')
        } else if (userType === 'staff') {
          navigate('/pos')
        }
        return
      }
    }

    logger.log('✅ Route protection passed - no redirect needed')
  }, [isAuthenticated, userType, pathname, user, needsSetup])

  const login = useCallback(async (credentials, loginType = 'client') => {
    logger.log('🔑 Login attempt:', credentials.email || credentials.staff_id, loginType)
    
    // PREVENT LOGIN IF ALREADY AUTHENTICATED
    if (isAuthenticated) {
      logger.log('🔑 User already authenticated, preventing new login')
      return { 
        success: false, 
        error: 'You are already logged in. Please logout first to switch accounts.' 
      }
    }
    
    setLoading(true)
    
    try {
      const endpoint = loginType === 'super_admin' 
        ? `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.SUPER_ADMIN_LOGIN}`
        : `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`

      logger.log('📡 Calling:', endpoint)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })

      const data = await response.json()
      logger.log('📦 Server response:', data)

      if (response.ok && data.token) {
        // Clear any existing session first
        localStorage.removeItem('authToken')
        localStorage.removeItem('userData')
        localStorage.removeItem('userType')
        localStorage.removeItem('companyData')
        localStorage.removeItem('subscriptionData')
        localStorage.removeItem('staffData')

        // Determine the correct user type
        const finalUserType = data.userType || loginType

        logger.log('💾 Storing auth data:', {
          userType: finalUserType,
          email: data.user.email
        })

        // Store data in localStorage
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('userData', JSON.stringify(data.user))
        localStorage.setItem('userType', finalUserType)

        if (data.company) {
          localStorage.setItem('companyData', JSON.stringify(data.company))
        }

        // Update state immediately - route protection effect will handle redirect
        setUser(data.user)
        setUserType(finalUserType)
        setIsAuthenticated(true)

        logger.log('✅ Login successful, route protection will redirect')

        return { success: true }
      } else {
        logger.log('❌ Login failed:', data.error)
        return { success: false, error: data.error || 'Login failed' }
      }
    } catch (error) {
      logger.error('❌ Login error:', error)
      return { success: false, error: 'Connection failed. Please check if the server is running.' }
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  const loginWithToken = useCallback(async (token: string) => {
    if (isAuthenticated) return { success: false, error: 'Already logged in' }
    setLoading(true)
    try {
      // Fetch full user + company data using the token
      const res = await fetch(`${API_CONFIG.BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) return { success: false, error: 'Invalid or expired token' }

      const data = await res.json()

      localStorage.removeItem('authToken')
      localStorage.removeItem('userData')
      localStorage.removeItem('userType')
      localStorage.removeItem('companyData')
      localStorage.removeItem('subscriptionData')
      localStorage.removeItem('staffData')

      localStorage.setItem('authToken', token)
      localStorage.setItem('userData', JSON.stringify(data.user))
      localStorage.setItem('userType', 'client')
      if (data.company) localStorage.setItem('companyData', JSON.stringify(data.company))

      setUser(data.user)
      setUserType('client')
      setIsAuthenticated(true)
      return { success: true }
    } catch {
      return { success: false, error: 'Connection failed' }
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  const logout = useCallback(async () => {
    logger.log('🚪 Logging out...')
    
    try {
      const token = localStorage.getItem('authToken')
      const currentUserType = localStorage.getItem('userType')
      
      if (token) {
        try {
          const endpoint = currentUserType === 'staff'
            ? `${API_CONFIG.BASE_URL}/staff/auth/logout`
            : `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGOUT}`
            
          await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
          logger.log('Server logout failed, continuing with local cleanup');
        }
      }
      
      // Clear local data
      localStorage.removeItem('authToken')
      localStorage.removeItem('userData')
      localStorage.removeItem('userType')
      localStorage.removeItem('companyData')
      localStorage.removeItem('subscriptionData')
      localStorage.removeItem('staffData')
      
      setUser(null)
      setUserType(null)
      setIsAuthenticated(false)
      // Route protection will handle redirect when isAuthenticated becomes false
    } catch (error) {
      logger.error('Logout error:', error)
      localStorage.removeItem('authToken')
      localStorage.removeItem('userData')
      localStorage.removeItem('userType')
      localStorage.removeItem('companyData')
      localStorage.removeItem('subscriptionData')
      localStorage.removeItem('staffData')

      setUser(null)
      setUserType(null)
      setIsAuthenticated(false)
    }
  }, [])

  const completeStaffLogin = useCallback((data: any) => {
    logger.log('✅ Staff login complete, updating auth state...')
    localStorage.setItem('authToken', data.token)
    localStorage.setItem('userType', 'staff')
    localStorage.setItem('staffData', JSON.stringify(data.staff))
    setUser(data.staff)
    setUserType('staff')
    setIsAuthenticated(true)
  }, [])

  const completeSetup = useCallback((data: any) => {
    logger.log('✅ Setup complete, auto-logging in...')
    localStorage.setItem('authToken', data.token)
    localStorage.setItem('userData', JSON.stringify(data.user))
    localStorage.setItem('userType', data.userType)
    if (data.company) {
      localStorage.setItem('companyData', JSON.stringify(data.company))
    }
    setUser(data.user)
    setUserType(data.userType)
    setIsAuthenticated(true)
    setNeedsSetup(false)
  }, [])

  const forceLogout = useCallback(async () => {
    logger.log('📄 Force logout for account switching...')
    
    try {
      const token = localStorage.getItem('authToken')
      
      if (token) {
        try {
          await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGOUT}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
          logger.log('Server logout failed, continuing with local cleanup');
        }
      }
      
      localStorage.removeItem('authToken')
      localStorage.removeItem('userData')
      localStorage.removeItem('userType')
      localStorage.removeItem('companyData')
      localStorage.removeItem('subscriptionData')
      localStorage.removeItem('staffData')
      
      setUser(null)
      setUserType(null)
      setIsAuthenticated(false)
      setInitialized(false)
    } catch (error) {
      logger.error('Force logout error:', error)
      localStorage.removeItem('authToken')
      localStorage.removeItem('userData')
      localStorage.removeItem('userType')
      localStorage.removeItem('companyData')
      localStorage.removeItem('subscriptionData')
      localStorage.removeItem('staffData')
      
      setUser(null)
      setUserType(null)
      setIsAuthenticated(false)
      setInitialized(false)
    }
  }, [])

  const value = {
    user,
    userType,
    loading,
    isAuthenticated,
    initialized,
    needsSetup,
    login,
    loginWithToken,
    logout,
    forceLogout,
    completeSetup,
    completeStaffLogin,
    isClient: userType === 'client',
    isSuperAdmin: userType === 'super_admin',
    isStaff: userType === 'staff',
  }

  // Don't render children until initialized
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E8302A] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}