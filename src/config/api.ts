// src/config/api.ts
import logger from '@/utils/logger';

const getApiUrl = () => {
  // Vite exposes env vars via import.meta.env (must be prefixed with VITE_)
  if (import.meta.env.VITE_API_URL) {
    logger.log('🔗 Using API URL from environment:', import.meta.env.VITE_API_URL)
    return import.meta.env.VITE_API_URL
  }

  // For development fallback
  if (import.meta.env.DEV) {
    logger.log('🔗 Using localhost for development')
    return 'http://localhost:3001'
  }

  // Production fallback
  logger.log('⚠️ No API URL env var found, using production fallback')
  return 'https://tindapos-backend.onrender.com'
}

const API_CONFIG = {
  BASE_URL: getApiUrl(),
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      SUPER_ADMIN_LOGIN: '/auth/super-admin/login',
      REGISTER: '/auth/register-company',
      VERIFY: '/auth/verify',
      LOGOUT: '/auth/logout'
    },
    ADMIN: {
      COMPANIES: '/admin/companies',
      USERS_STATS: '/admin/stats/users',
      SUBSCRIPTION_STATS: '/admin/stats/subscriptions'
    },
    HEALTH: '/health'
  }
}

// Debug logging (only in development)
if (import.meta.env.DEV) {
  logger.log('🔗 API Configuration:', {
    VITE_API_URL: import.meta.env.VITE_API_URL || 'NOT SET',
    MODE: import.meta.env.MODE,
    COMPUTED_BASE_URL: API_CONFIG.BASE_URL
  })
}

export default API_CONFIG