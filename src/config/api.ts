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
  return 'https://api.tindapo.com'
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
      USERS: '/admin/users',
      USERS_STATS: '/admin/stats/users',
      SUBSCRIPTION_STATS: '/admin/stats/subscriptions'
    },
    FINANCE: {
      GCASH: '/pos/gcash',                         // GET list+summary, POST record, DELETE /:id (owner)
      GCASH_SETTINGS: '/pos/gcash/settings',       // GET fee rules
      GCASH_SETTINGS_SAVE: '/client/settings/gcash', // PUT fee rules (owner)
      EXPENSES: '/pos/expenses'                    // GET list+summary, POST, PUT/DELETE /:id (owner)
    },
    BIR: {
      SETTINGS: '/client/settings/bir',            // GET/PUT company BIR registration + per-store branch code, PTU/MIN/MSN, invoicing mode
      EIS: '/client/settings/eis',                 // GET/PUT/DELETE e-invoicing provider (TaxTrail) connection — key never returned
      EIS_TEST: '/client/settings/eis/test',       // POST re-test the saved connection
      EINVOICES: '/client/einvoices'               // GET status list (?filter=attention|pending|all), POST /:id/retry
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