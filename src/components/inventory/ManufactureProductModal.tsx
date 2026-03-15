// src/components/inventory/ManufactureProductModal.jsx

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { SuccessModal } from "@/components/ui/success-modal"
import { 
  Loader2,
  Factory,
  AlertCircle,
  CheckCircle,
  XCircle,
  Package
} from "lucide-react"
import API_CONFIG from "@/config/api"

export function ManufactureProductModal({ product, open, onOpenChange, onManufactured }) {
  const [loading, setLoading] = useState(false)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [error, setError] = useState("")
  
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  
  const [availability, setAvailability] = useState(null)
  const [canManufacture, setCanManufacture] = useState(false)
  const [maxQuantity, setMaxQuantity] = useState(0)
  
  const [formData, setFormData] = useState({
    quantity: "",
    batch_number: "",
    expiry_date: "",
    notes: ""
  })

  useEffect(() => {
    if (open && product) {
      checkAvailability(1)
    }
  }, [open, product])

  useEffect(() => {
    if (!open) {
      setFormData({
        quantity: "",
        batch_number: "",
        expiry_date: "",
        notes: ""
      })
      setAvailability(null)
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

  const checkAvailability = async (quantity) => {
    try {
      setCheckingAvailability(true)
      setError("")

      const data = await makeApiCall(`/client/manufacturing/${product.id}/check?quantity=${quantity}`)
      
      if (data) {
        setAvailability(data.availability)
        setCanManufacture(data.can_manufacture)
        setMaxQuantity(data.max_quantity)
      }
    } catch (error) {
      console.error('Check availability error:', error)
      setError(error.message || 'Failed to check availability')
    } finally {
      setCheckingAvailability(false)
    }
  }

  const handleQuantityChange = (value) => {
    setFormData(prev => ({ ...prev, quantity: value }))
    
    const qty = parseInt(value)
    if (qty > 0) {
      checkAvailability(qty)
    }
  }

  const validateForm = () => {
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      setError("Quantity must be greater than 0")
      return false
    }

    if (parseInt(formData.quantity) > maxQuantity) {
      setError(`Cannot manufacture more than ${maxQuantity} units (insufficient ingredients)`)
      return false
    }

    if (!canManufacture) {
      setError("Insufficient ingredients to manufacture this product")
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
      const data = await makeApiCall(`/client/manufacturing/${product.id}/manufacture`, {
        method: 'POST',
        body: JSON.stringify(formData)
      })

      if (data) {
        setSuccessMessage(`Successfully manufactured ${formData.quantity} units of ${product.name}!`)
        setShowSuccessModal(true)
        
        if (onManufactured) {
          onManufactured(product.id)
        }

        onOpenChange(false)
      }

    } catch (error) {
      console.error('Manufacture product error:', error)
      setError(error.message || 'Failed to manufacture product')
    } finally {
      setLoading(false)
    }
  }

  if (!product) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-blue-600" />
              Manufacture Product - {product.name}
            </DialogTitle>
            <DialogDescription>
              Produce units of this product using ingredients from inventory
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!product.is_composite && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This product does not have a recipe and cannot be manufactured. 
                    It's a simple product that should be purchased or received directly.
                  </AlertDescription>
                </Alert>
              )}

              {/* Current Stock */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Stock:</span>
                  <span className="text-lg font-semibold">
                    {product.stock_quantity || 0} units
                  </span>
                </div>
              </div>

              {/* Manufacturing Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Quantity to Manufacture *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={maxQuantity}
                      placeholder="0"
                      value={formData.quantity}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      disabled={loading || !product.is_composite}
                    />
                    {maxQuantity > 0 && (
                      <p className="text-xs text-gray-500">
                        Maximum: {maxQuantity} units
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="batch_number">Batch Number (Optional)</Label>
                    <Input
                      id="batch_number"
                      placeholder="e.g., BATCH-001"
                      value={formData.batch_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, batch_number: e.target.value }))}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="expiry_date">Expiry Date (Optional)</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                    disabled={loading}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes..."
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Ingredient Availability */}
              {availability && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Ingredient Availability
                  </h3>

                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ingredient</TableHead>
                          <TableHead>Needed</TableHead>
                          <TableHead>Available</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {availability.map((item) => (
                          <TableRow key={item.ingredient_id}>
                            <TableCell className="font-medium">
                              {item.ingredient_name}
                            </TableCell>
                            <TableCell>
                              {item.needed} {item.unit}
                            </TableCell>
                            <TableCell>
                              {item.available} {item.unit}
                            </TableCell>
                            <TableCell>
                              {item.sufficient ? (
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Sufficient
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800 border-red-200">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Short {item.shortage} {item.unit}
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {checkingAvailability && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-sm text-gray-600">Checking ingredient availability...</span>
                </div>
              )}
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
              <Button 
                type="submit" 
                disabled={loading || !canManufacture || !product.is_composite}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Manufacturing...
                  </>
                ) : (
                  <>
                    <Factory className="mr-2 h-4 w-4" />
                    Manufacture
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
        title="Product Manufactured!"
        description={successMessage}
      />
    </>
  )
}