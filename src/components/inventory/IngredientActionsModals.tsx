import { formatCurrency } from '@/lib/utils'
// src/components/inventory/IngredientActionsModals.jsx

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Beaker,
  Edit, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  Eye,
  Calendar,
  DollarSign,
  Package,
  ArrowUpCircle,
  ArrowDownCircle
} from "lucide-react"
import { SuccessModal } from "@/components/ui/success-modal"
import API_CONFIG from "@/config/api"

// 1. VIEW INGREDIENT MODAL
export function ViewIngredientModal({ ingredient, open, onOpenChange }) {

  const getStockStatus = (ingredient) => {
    if (ingredient.stock_quantity <= 0) {
      return { status: 'out', color: 'bg-red-100 text-red-800', text: 'Out of Stock' }
    } else if (ingredient.stock_quantity <= ingredient.min_stock_level) {
      return { status: 'low', color: 'bg-orange-100 text-orange-800', text: 'Low Stock' }
    } else {
      return { status: 'good', color: 'bg-green-100 text-green-800', text: 'In Stock' }
    }
  }

  if (!ingredient) return null

  const stockStatus = getStockStatus(ingredient)
  const totalValue = ingredient.unit_cost * ingredient.stock_quantity

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Beaker className="h-5 w-5 text-blue-600" />
            Ingredient Details
          </DialogTitle>
          <DialogDescription>
            View complete information about this ingredient
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{ingredient.name}</h3>
              {ingredient.description && (
                <p className="text-sm text-gray-600 mt-1">{ingredient.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">{ingredient.sku}</code>
                <Badge className={stockStatus.color}>{stockStatus.text}</Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Stock Information */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Stock Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Stock:</span>
                  <span className="font-semibold">{ingredient.stock_quantity} {ingredient.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Minimum Level:</span>
                  <span>{ingredient.min_stock_level} {ingredient.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Unit Cost:</span>
                  <span className="font-medium">{formatCurrency(ingredient.unit_cost)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-600">Total Value:</span>
                  <span className="font-semibold text-blue-600">{formatCurrency(totalValue)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Additional Details
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Unit:</span>
                  <span className="font-medium">{ingredient.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Supplier:</span>
                  <span>{ingredient.supplier || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span>{new Date(ingredient.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span>{new Date(ingredient.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// 2. EDIT INGREDIENT MODAL
export function EditIngredientModal({ ingredient, open, onOpenChange, onIngredientUpdated }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [stores, setStores] = useState([])
  
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    unit: "g",
    unit_cost: "",
    min_stock_level: "",
    supplier: ""
  })

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

  useEffect(() => {
    if (ingredient && open) {
      setFormData({
        name: ingredient.name || "",
        description: ingredient.description || "",
        sku: ingredient.sku || "",
        unit: ingredient.unit || "g",
        unit_cost: ingredient.unit_cost || "",
        min_stock_level: ingredient.min_stock_level || "",
        supplier: ingredient.supplier || ""
      })
    }
  }, [ingredient, open])

  useEffect(() => {
    if (!open) {
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
      console.error('API call failed:', error)
      throw error
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
      const data = await makeApiCall(`/client/ingredients/${ingredient.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      })

      if (data) {
        setSuccessMessage(`Ingredient "${data.ingredient.name}" has been successfully updated!`)
        setShowSuccessModal(true)
        
        if (onIngredientUpdated) {
          onIngredientUpdated(data.ingredient)
        }

        onOpenChange(false)
      }

    } catch (error) {
      console.error('Update ingredient error:', error)
      setError(error.message || 'Failed to update ingredient. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!ingredient) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Edit Ingredient
            </DialogTitle>
            <DialogDescription>
              Update ingredient information
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
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
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
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
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
                        <SelectValue />
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
                      value={formData.unit_cost}
                      onChange={(e) => handleInputChange('unit_cost', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Stock Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Stock Settings</h3>
                
                <div className="grid gap-2">
                  <Label htmlFor="min_stock_level">Minimum Stock Level</Label>
                  <Input
                    id="min_stock_level"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.min_stock_level}
                    onChange={(e) => handleInputChange('min_stock_level', e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500">
                    Current stock: {ingredient.stock_quantity} {ingredient.unit}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    Update Ingredient
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
        title="Ingredient Updated!"
        description={successMessage}
      />
    </>
  )
}

// 3. DELETE INGREDIENT DIALOG
export function DeleteIngredientDialog({ ingredient, open, onOpenChange, onIngredientDeleted }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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
      console.error('API call failed:', error)
      throw error
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    setError("")

    try {
      await makeApiCall(`/client/ingredients/${ingredient.id}`, {
        method: 'DELETE'
      })

      if (onIngredientDeleted) {
        onIngredientDeleted(ingredient.id)
      }

      onOpenChange(false)
    } catch (error) {
      console.error('Delete ingredient error:', error)
      setError(error.message || 'Failed to delete ingredient. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!ingredient) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Delete Ingredient
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Are you sure you want to delete <strong>{ingredient.name}</strong>?</p>
            <p className="text-sm text-red-600">
              This action cannot be undone. The ingredient will be permanently removed if it's not used in any recipes.
            </p>
            {error && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Ingredient
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// 4. STOCK ADJUSTMENT MODAL
export function StockAdjustmentModal({ ingredient, open, onOpenChange, onStockUpdated }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  
  const [formData, setFormData] = useState({
    movement_type: "in",
    quantity: "",
    notes: ""
  })

  useEffect(() => {
    if (!open) {
      setFormData({
        movement_type: "in",
        quantity: "",
        notes: ""
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
      console.error('API call failed:', error)
      throw error
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError("")
  }

  const validateForm = () => {
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      setError("Quantity must be greater than 0")
      return false
    }

    if (formData.movement_type === 'out' && parseFloat(formData.quantity) > ingredient.stock_quantity) {
      setError("Cannot remove more than current stock")
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
      const data = await makeApiCall(`/client/ingredients/${ingredient.id}/stock`, {
        method: 'PATCH',
        body: JSON.stringify(formData)
      })

      if (data) {
        setShowSuccessModal(true)
        
        if (onStockUpdated) {
          onStockUpdated()
        }

        setTimeout(() => {
          onOpenChange(false)
        }, 1500)
      }

    } catch (error) {
      console.error('Stock adjustment error:', error)
      setError(error.message || 'Failed to adjust stock. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!ingredient) return null

  const calculateNewStock = () => {
    const current = parseFloat(ingredient.stock_quantity)
    const qty = parseFloat(formData.quantity) || 0
    
    if (formData.movement_type === 'in' || formData.movement_type === 'adjustment') {
      return current + qty
    } else if (formData.movement_type === 'out') {
      return current - qty
    }
    return current
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-blue-600" />
              Adjust Stock - {ingredient.name}
            </DialogTitle>
            <DialogDescription>
              Update ingredient stock quantity
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

              {/* Current Stock Display */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Stock:</span>
                  <span className="text-lg font-semibold">
                    {ingredient.stock_quantity} {ingredient.unit}
                  </span>
                </div>
                {formData.quantity && (
                  <div className="flex justify-between items-center mt-2 pt-2 border-t">
                    <span className="text-sm text-gray-600">New Stock:</span>
                    <span className="text-lg font-semibold text-blue-600">
                      {calculateNewStock()} {ingredient.unit}
                    </span>
                  </div>
                )}
              </div>

              {/* Movement Type */}
              <div className="grid gap-2">
                <Label htmlFor="movement_type">Movement Type</Label>
                <Select
                  value={formData.movement_type}
                  onValueChange={(value) => handleInputChange('movement_type', value)}
                  disabled={loading}
                >
                  <SelectTrigger id="movement_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">
                      <div className="flex items-center gap-2">
                        <ArrowUpCircle className="h-4 w-4 text-green-600" />
                        Stock In (Add)
                      </div>
                    </SelectItem>
                    <SelectItem value="out">
                      <div className="flex items-center gap-2">
                        <ArrowDownCircle className="h-4 w-4 text-red-600" />
                        Stock Out (Remove)
                      </div>
                    </SelectItem>
                    <SelectItem value="adjustment">
                      <div className="flex items-center gap-2">
                        <Edit className="h-4 w-4 text-blue-600" />
                        Adjustment
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity ({ingredient.unit})</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Notes */}
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Reason for adjustment..."
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adjusting...
                  </>
                ) : (
                  <>
                    <ArrowUpCircle className="mr-2 h-4 w-4" />
                    Adjust Stock
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
        title="Stock Updated!"
        description="Ingredient stock has been successfully adjusted."
      />
    </>
  )
}