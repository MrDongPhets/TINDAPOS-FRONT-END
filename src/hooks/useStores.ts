// src/hooks/useStores.js - Fixed endpoint URL
import { useState, useEffect } from 'react'
import API_CONFIG from '@/config/api'
import { localDb } from '@/db/localDb'

export function useStores() {
  const [stores, setStores] = useState([])
  const [selectedStore, setSelectedStore] = useState(null)
  const [viewMode, setViewMode] = useState('single') // 'single' or 'all'
  const [loading, setLoading] = useState(false)

  // Load saved preferences
  useEffect(() => {
    const savedStoreId = localStorage.getItem('selectedStoreId')
    const savedViewMode = localStorage.getItem('storeViewMode') || 'single'
    setViewMode(savedViewMode)

    if (savedStoreId && stores.length > 0) {
      const savedStore = stores.find(store => store.id === savedStoreId)
      if (savedStore) {
        setSelectedStore(savedStore)
      }
    }
  }, [stores])

  // Pre-load from cache on mount so offline stores show immediately on page refresh
  useEffect(() => {
    loadFromCache()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadFromCache = async () => {
    const companyData = localStorage.getItem('companyData')
    const companyId = companyData ? JSON.parse(companyData).id : ''
    const cachedStores = companyId
      ? await localDb.stores.where('company_id').equals(companyId).toArray()
      : await localDb.stores.toArray()
    if (cachedStores.length > 0) {
      setStores(cachedStores)
      const savedStoreId = localStorage.getItem('selectedStoreId')
      const toSelect = cachedStores.find(s => s.id === savedStoreId) || cachedStores[0]
      if (toSelect && viewMode === 'single') selectStore(toSelect)
    }
  }

  // Fetch stores from API - FIXED ENDPOINT
  const fetchStores = async () => {
    try {
      setLoading(true)

      // ── OFFLINE: load from IndexedDB cache ──────────────────────
      if (!navigator.onLine) {
        await loadFromCache()
        return
      }

      // ── ONLINE: fetch from API (fallback to cache on network error) ─
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_CONFIG.BASE_URL}/client/stores`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const storeList = data.stores || []
        setStores(storeList)

        // Cache for offline use
        if (storeList.length > 0) {
          const companyData = localStorage.getItem('companyData')
          const companyId = companyData ? JSON.parse(companyData).id : ''
          const now = Date.now()
          await localDb.stores.bulkPut(
            storeList.map((s: any) => ({ ...s, company_id: s.company_id || companyId, cached_at: now }))
          )
        }

        // Auto-select first store if none selected
        if (!selectedStore && storeList.length > 0 && viewMode === 'single') {
          selectStore(storeList[0])
        }
      } else {
        console.error('Failed to fetch stores:', response.status, response.statusText)
        await loadFromCache()
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error)
      await loadFromCache()
    } finally {
      setLoading(false)
    }
  }

  // Request a new store
  const requestStore = async (storeData: Record<string, unknown>) => {
    try {
      const token = localStorage.getItem('authToken')
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/client/stores/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(storeData)
      })

      if (response.ok) {
        const data = await response.json()
        // Refresh stores list after successful request
        fetchStores()
        return { success: true, data }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.error }
      }
    } catch (error) {
      console.error('Failed to request store:', error)
      return { success: false, error: 'Network error occurred' }
    }
  }

  // Select a store
  const selectStore = (store: { id: string; name: string }) => {
    setSelectedStore(store)
    setViewMode('single')
    localStorage.setItem('selectedStoreId', store?.id || '')
    localStorage.setItem('storeViewMode', 'single')
  }

  // Toggle view mode
  const toggleViewMode = () => {
    const newMode = viewMode === 'single' ? 'all' : 'single'
    setViewMode(newMode)
    localStorage.setItem('storeViewMode', newMode)
    
    if (newMode === 'all') {
      setSelectedStore(null)
      localStorage.removeItem('selectedStoreId')
    }
  }

  // Get API URL with store filter
  const getApiUrl = (endpoint: string) => {
    const url = new URL(`${API_CONFIG.BASE_URL}${endpoint}`)
    if (viewMode === 'single' && selectedStore) {
      url.searchParams.append('store_id', selectedStore.id)
    }
    return url.toString()
  }

  return {
    stores,
    selectedStore,
    viewMode,
    loading,
    isAllStoresView: viewMode === 'all',
    fetchStores,
    requestStore,
    selectStore,
    toggleViewMode,
    getApiUrl
  }
}