// src/components/inventory/AddIngredientModal.jsx
import logger from '@/utils/logger';

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SuccessModal } from "@/components/ui/success-modal"
import { Loader2, Plus, Beaker, AlertCircle } from "lucide-react"
import API_CONFIG from "@/config/api"

export function AddIngredientModal({ onIngredientAdded, trigger = null }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    unit: "g",
    unit_cost: "",
    stock_quantity: "",
    min_stock_level: "",
    store_id: "",
    supplier: ""
  })
  
  // Options for dropdowns
  const [stores, setStores] = useState([])

  const unitOptions = [
    { value: "g", label: "Grams (g)" },
    { value: "kg", label: "Kilograms (kg)" },
    { value: "ml", label: "Milliliters (ml)" },
    { value: "l", label: "Liters (l)" },
    { value: "oz", label: "Ounces (oz)" },
    { value: "lb", label: "Pounds (lb)" },
    { value: "pcs", label: "Pieces (pcs)" },
    { value: "cup", label: "Cups" },
    { value: "tbsp", label: "Tablespoons" },
    { value: "tsp", label: "Teaspoons" }
  ]

  // Load stores when modal opens
  useEffect(() => {
    if (open) {
      fetchStores()
    }
  }, [open])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({
        name: "",
        description: "",
        sku: "",
        unit: "g",
        unit_cost: "",
        stock_quantity: "",
        min_stock_level: "",
        store_id: "",
        supplier: ""
      })
      setError("")
    }
  }, [open])

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const makeApiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        headers: getAuthHeaders(),
        ...options
      })

      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json()
        if (errorData.code === 'TOKEN_EXPIRED' || errorData.code === 'INVALID_TOKEN') {
          alert('Your session has expired. Please log in again.')
          window.location.href = '/login'
          return null
        }
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      logger.error('API call failed:', error)
      throw error
    }
  }

  const fetchStores = async () => {
    try {
      const data = await makeApiCall('/client/stores')
      if (data) {
        setStores(data.stores || [])
      }
    } catch (error) {
      logger.error('Failed to fetch stores:', error)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError("")
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Ingredient name is required")
      return false
    }
    
    if (!formData.unit) {
      setError("Unit is required")
      return false
    }
    
    if (!formData.unit_cost || parseFloat(formData.unit_cost) <= 0) {
      setError("Unit cost must be greater than 0")
      return false
    }
    
    if (!formData.store_id) {
      setError("Please select a store")
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError("")

    try {
      logger.log('🥤 Creating ingredient:', formData.name)

      const data = await makeApiCall('/client/ingredients', {
        method: 'POST',
        body: JSON.stringify(formData)
      })

      if (data) {
        setSuccessMessage(`Ingredient "${data.ingredient.name}" has been successfully added!`)
        setShowSuccessModal(true)
        
        if (onIngredientAdded) {
          onIngredientAdded(data.ingredient)
        }

        setOpen(false)
      }

    } catch (error) {
      logger.error('Create ingredient error:', error)
      const errorMessage = error.message || 'Failed to create ingredient. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Ingredient
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Beaker className="h-5 w-5 text-blue-600" />
              Add New Ingredient
            </DialogTitle>
            <DialogDescription>
              Add a new raw material or ingredient to your inventory
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Basic Information</h3>
                
                <div className="grid gap-2">
                  <Label htmlFor="name">Ingredient Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Coffee Beans, Milk, Sugar"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Optional description"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      placeholder="Auto-generated if empty"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      placeholder="e.g., ABC Supplier"
                      value={formData.supplier}
                      onChange={(e) => handleInputChange('supplier', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Pricing & Units */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Pricing & Units</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="unit">Unit *</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => handleInputChange('unit', value)}
                      disabled={loading}
                    >
                      <SelectTrigger id="unit">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {unitOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="unit_cost">Unit Cost * (₱)</Label>
                    <Input
                      id="unit_cost"
                      type="number"
                      step="0.0001"
                      min="0"
                      placeholder="0.00"
                      value={formData.unit_cost}
                      onChange={(e) => handleInputChange('unit_cost', e.target.value)}
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500">Cost per {formData.unit || 'unit'}</p>
                  </div>
                </div>
              </div>

              {/* Stock Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Stock Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="stock_quantity">Initial Stock Quantity</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      value={formData.stock_quantity}
                      onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="min_stock_level">Minimum Stock Level</Label>
                    <Input
                      id="min_stock_level"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="10"
                      value={formData.min_stock_level}
                      onChange={(e) => handleInputChange('min_stock_level', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Store Selection */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Store Assignment</h3>
                
                <div className="grid gap-2">
                  <Label htmlFor="store_id">Store *</Label>
                  <Select
                    value={formData.store_id}
                    onValueChange={(value) => handleInputChange('store_id', value)}
                    disabled={loading}
                  >
                    <SelectTrigger id="store_id">
                      <SelectValue placeholder="Select store" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map(store => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Ingredient
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <SuccessModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        title="Ingredient Added!"
        description={successMessage}
      />
    </>
  )
}