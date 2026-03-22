// src/components/inventory/AddProductModal.jsx - With composite product support
import logger from '@/utils/logger';

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
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
import { ImageUpload } from "@/components/ui/image-upload"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SuccessModal } from "@/components/ui/success-modal"
import { Loader2, Plus, Package, AlertCircle, ChefHat, Info, Tag, ArrowRight } from "lucide-react"
import API_CONFIG from "@/config/api"
import { formatCurrency } from "@/lib/utils"

export function AddProductModal({ onProductAdded, trigger = null }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  
  // Composite product state
  const [isComposite, setIsComposite] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    barcode: "",
    category_id: "",
    store_id: "",
    default_price: "",
    manila_price: "",
    delivery_price: "",
    wholesale_price: "",
    cost_price: "",
    expiry_date: "",
    stock_quantity: "",
    min_stock_level: "",
    max_stock_level: "",
    unit: "pcs",
    weight: "",
    image_url: ""
  })
  
  // Options for dropdowns
  const [categories, setCategories] = useState([])
  const [stores, setStores] = useState([])

  // Load categories and stores when modal opens
  useEffect(() => {
    if (open) {
      fetchCategories()
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
        barcode: "",
        category_id: "",
        store_id: "",
        default_price: "",
        manila_price: "",
        delivery_price: "",
        wholesale_price: "",
        cost_price: "",
        expiry_date: "",
        stock_quantity: "",
        min_stock_level: "",
        max_stock_level: "",
        unit: "pcs",
        weight: "",
        image_url: ""
      })
      setError("")
      setSuccessMessage("")
      setIsComposite(false)
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

  const fetchCategories = async () => {
    try {
      const data = await makeApiCall('/client/products/categories')
      if (data) {
        setCategories(data.categories || [])
      }
    } catch (error) {
      logger.error('Failed to fetch categories:', error)
    }
  }

  const fetchStores = async () => {
    try {
      const data = await makeApiCall('/client/dashboard/stores')
      if (data) {
        const storeList = data.stores || []
        setStores(storeList)
        if (storeList.length === 1) {
          handleInputChange('store_id', storeList[0].id)
        }
      }
    } catch (error) {
      logger.error('Failed to fetch stores:', error)
      const companyData = localStorage.getItem('companyData')
      if (companyData) {
        const company = JSON.parse(companyData)
        setStores([{ id: 'store1', name: 'Main Store' }])
      }
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError("")
  }

  const handleCompositeChange = (checked) => {
    setIsComposite(checked)
    if (checked) {
      // Clear stock values for composite products
      setFormData(prev => ({
        ...prev,
        stock_quantity: "",
        min_stock_level: "",
        max_stock_level: ""
      }))
    }
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Product name is required")
      return false
    }
    
    if (!formData.default_price || parseFloat(formData.default_price) <= 0) {
      setError("Default price must be greater than 0")
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
      logger.log('📦 Creating product:', formData.name)

      const data = await makeApiCall('/client/products', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          is_composite: isComposite
        })
      })

      if (data) {
        const productType = isComposite ? "composite product" : "product"
        const additionalMsg = isComposite 
          ? " Don't forget to add a recipe for this product!" 
          : ""
        
        setSuccessMessage(
          `Product "${data.product.name}" has been successfully added as a ${productType}!${additionalMsg}`
        )
        setShowSuccessModal(true)
        
        if (onProductAdded) {
          onProductAdded(data.product)
        }

        setOpen(false)
      }

    } catch (error) {
      logger.error('Create product error:', error)
      const errorMessage = error.message || 'Failed to create product. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false)
    setSuccessMessage("")
  }

  return (
    <>
      {/* Main Add Product Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button className="bg-[#E8302A] hover:bg-[#B91C1C]">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Add New Product
            </DialogTitle>
            <DialogDescription>
              Create a new product for your inventory. Fill in the details below.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-gray-700">Basic Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Coca Cola 500ml"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    placeholder="Product SKU"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Product description..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category_id">Category</Label>
                  {categories.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => { setOpen(false); navigate('/client/inventory/categories') }}
                      className="w-full flex items-center justify-between gap-2 rounded-md border border-dashed border-orange-300 bg-orange-50 px-3 py-2.5 text-sm text-orange-700 hover:bg-orange-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 shrink-0" />
                        <span>No categories yet — tap to create one first</span>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </button>
                  ) : (
                    <>
                      <Select value={formData.category_id || ""} onValueChange={(value) => handleInputChange('category_id', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button
                        type="button"
                        onClick={() => { setOpen(false); navigate('/client/inventory/categories') }}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1"
                      >
                        <Plus className="h-3 w-3" />
                        Add new category
                      </button>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="store_id">Store *</Label>
                  <Select value={formData.store_id || ""} onValueChange={(value) => handleInputChange('store_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select store" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Product Type Selection */}
            <div className="space-y-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="is_composite"
                  checked={isComposite}
                  onChange={(e) => handleCompositeChange(e.target.checked)}
                  className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  disabled={loading}
                />
                <div className="flex-1">
                  <label htmlFor="is_composite" className="text-sm font-medium text-gray-900 flex items-center gap-2 cursor-pointer">
                    <ChefHat className="h-4 w-4 text-purple-600" />
                    This is a composite product (made from ingredients)
                  </label>
                  <p className="text-xs text-gray-600 mt-1">
                    Check this if the product is made from raw ingredients (e.g., coffee drinks, sandwiches, etc.)
                  </p>
                </div>
              </div>
              
              {isComposite && (
                <Alert className="bg-purple-100 border-purple-300">
                  <Info className="h-4 w-4 text-purple-700" />
                  <AlertDescription className="text-xs text-purple-900">
                    <strong>Composite products are made-to-order.</strong> Stock will not be tracked for this product. 
                    After creating the product, you'll need to add a recipe to define which ingredients are needed.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Pricing Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-gray-700">Pricing</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default_price">Default Price *</Label>
                  <Input
                    id="default_price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.default_price}
                    onChange={(e) => handleInputChange('default_price', e.target.value)}
                    required
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost_price">
                    Cost Price {isComposite ? "(Auto from Recipe)" : "(Supplier)"}
                  </Label>
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    placeholder={isComposite ? "Calculated after adding recipe" : "0.00"}
                    value={formData.cost_price}
                    onChange={(e) => handleInputChange('cost_price', e.target.value)}
                    readOnly={isComposite}
                    className={isComposite ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}
                  />
                  {isComposite && (
                    <p className="text-xs text-blue-600">Cost will be auto-calculated when you save the recipe.</p>
                  )}
                </div>
              </div>

              {/* Profit margin preview */}
              {formData.default_price && formData.cost_price && parseFloat(formData.cost_price) > 0 && (() => {
                const profit = parseFloat(formData.default_price) - parseFloat(formData.cost_price)
                const margin = (profit / parseFloat(formData.default_price)) * 100
                return (
                  <div className={`rounded-md p-3 text-sm border ${margin >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <span className={`font-medium ${margin >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      Profit per item: {formatCurrency(profit)}
                      {' '}({margin >= 0 ? '+' : ''}{margin.toFixed(1)}% margin)
                    </span>
                  </div>
                )
              })()}
            </div>

            {/* Expiry Date - Only for non-composite products */}
            {!isComposite && (
              <div className="space-y-2">
                <Label htmlFor="expiry_date">Expiry Date <span className="text-gray-400 text-xs">(optional)</span></Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => handleInputChange('expiry_date', e.target.value)}
                />
              </div>
            )}

            {/* Stock Information - Only show for non-composite products */}
            {!isComposite && (
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-gray-700">Stock Management</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock_quantity">Current Stock</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      placeholder="0"
                      value={formData.stock_quantity}
                      onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_stock_level">Max Stock Level</Label>
                    <Input
                      id="max_stock_level"
                      type="number"
                      placeholder="e.g. 50"
                      value={formData.max_stock_level}
                      onChange={(e) => handleInputChange('max_stock_level', e.target.value)}
                    />
                    <p className="text-xs text-gray-400">Low stock alert at 30% of this value</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select onValueChange={(value) => handleInputChange('unit', value)} defaultValue="pcs">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pcs">Pieces</SelectItem>
                        <SelectItem value="kg">Kilogram</SelectItem>
                        <SelectItem value="g">Gram</SelectItem>
                        <SelectItem value="L">Liter</SelectItem>
                        <SelectItem value="ml">Milliliter</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="pack">Pack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight</Label>
                    <Input
                      id="weight"
                      placeholder="Product weight"
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Additional Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-gray-700">Additional Information</h4>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    placeholder="Product barcode"
                    value={formData.barcode}
                    onChange={(e) => handleInputChange('barcode', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product-image">Product Image</Label>
                  <ImageUpload
                    value={formData.image_url}
                    onChange={(url) => handleInputChange('image_url', url)}
                    disabled={loading}
                    maxSize={20 * 1024 * 1024} // 20MB — compressed by backend before R2
                  />
                </div>
              </div>
            </div>

            {/* Error Messages */}
            {error && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-[#E8302A] hover:bg-[#B91C1C]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Product
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <SuccessModal
        open={showSuccessModal}
        onOpenChange={handleSuccessModalClose}
        title="Product Added Successfully!"
        description={successMessage || "Your product has been added to the inventory."}
        buttonText="OK"
      />
    </>
  )
}