// src/hooks/useApiClient.js - Custom hook for API calls with token handling
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/components/auth/AuthProvider'
import authService from '@/services/authService'
import logger from '@/utils/logger';

export function useApiClient() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const apiCall = useCallback(async (endpoint, options = {}) => {
    try {
      const response = await authService.apiRequest(endpoint, options)
      
      // Handle different response statuses
      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json()

        if (errorData.code === 'TOKEN_EXPIRED' || errorData.code === 'INVALID_TOKEN') {
          logger.log('🚨 Token expired during API call, logging out')
          logout()
          throw new Error('Session expired. Please login again.')
        }

        if (errorData.code === 'SUBSCRIPTION_EXPIRED') {
          logger.log('🚨 Subscription expired, redirecting')
          navigate('/client/subscription-expired')
          throw new Error(errorData.error || 'Subscription expired.')
        }
      }

      // Check if response is ok
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      // Return parsed JSON
      const data = await response.json()
      return { success: true, data }
      
    } catch (error) {
      logger.error('API call failed:', error)
      return { success: false, error: error.message }
    }
  }, [logout])

  const get = useCallback((endpoint) => {
    return apiCall(endpoint, { method: 'GET' })
  }, [apiCall])

  const post = useCallback((endpoint, body = null) => {
    return apiCall(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : null
    })
  }, [apiCall])

  const put = useCallback((endpoint, body = null) => {
    return apiCall(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : null
    })
  }, [apiCall])

  const del = useCallback((endpoint) => {
    return apiCall(endpoint, { method: 'DELETE' })
  }, [apiCall])

  return {
    apiCall,
    get,
    post,
    put,
    delete: del
  }
}