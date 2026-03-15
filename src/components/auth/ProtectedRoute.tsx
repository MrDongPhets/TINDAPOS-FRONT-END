// src/components/auth/ProtectedRoute.jsx - Fixed version to prevent loops
import logger from '@/utils/logger';

import { useAuth } from './AuthProvider'
import { useEffect, useState } from 'react'

export function ProtectedRoute({ children, requiredUserType }) {
  const { isAuthenticated, userType, loading } = useAuth()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!loading) {
      logger.log('🛡️ Route protection check:', { isAuthenticated, userType, requiredUserType })
      
      if (!isAuthenticated) {
        logger.log('❌ Not authenticated, redirecting to login...')
        if (requiredUserType === 'super_admin') {
          window.location.href = '/system-admin'
        } else {
          window.location.href = '/login'
        }
        return
      }

      if (requiredUserType && userType !== requiredUserType) {
        logger.log('❌ Wrong user type, redirecting...')
        if (userType === 'client') {
          window.location.href = '/client/dashboard'
        } else if (userType === 'super_admin') {
          window.location.href = '/admin/dashboard'
        }
        return
      }

      logger.log('✅ Route protection passed')
      setChecking(false)
    }
  }, [loading, isAuthenticated, userType, requiredUserType])

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  if (requiredUserType && userType !== requiredUserType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Access denied. Redirecting...</p>
        </div>
      </div>
    )
  }

  return children
}

export function AdminProtectedRoute({ children }) {
  return (
    <ProtectedRoute requiredUserType="super_admin">
      {children}
    </ProtectedRoute>
  )
}

export function ClientProtectedRoute({ children }) {
  return (
    <ProtectedRoute requiredUserType="client">
      {children}
    </ProtectedRoute>
  )
}