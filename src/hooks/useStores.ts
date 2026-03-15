// src/hooks/useStores.js - Fixed endpoint URL
import { useState, useEffect } from 'react'
import API_CONFIG from '@/config/api'

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

  // Fetch stores from API - FIXED ENDPOINT
  const fetchStores = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      
      // FIXED: Correct endpoint WITHOUT /api prefix
      const response = await fetch(`${API_CONFIG.BASE_URL}/client/stores`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStores(data.stores || [])
        
        // Auto-select first store if none selected
        if (!selectedStore && data.stores?.length > 0 && viewMode === 'single') {
          selectStore(data.stores[0])
        }
      } else {
        console.error('Failed to fetch stores:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error)
    } finally {
      setLoading(false)
    }
  }

  // Request a new store
  const requestStore = async (storeData) => {
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
  const selectStore = (store) => {
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
  const getApiUrl = (endpoint) => {
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