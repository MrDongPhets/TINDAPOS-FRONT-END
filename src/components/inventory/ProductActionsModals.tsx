import { formatCurrency } from '@/lib/utils'
// src/components/inventory/ProductActionsModals.jsx - Complete file with FIFO expiry date

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
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
  Package,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Eye,
  Calendar,
  DollarSign,
  BarChart3,
  ChefHat,
  Layers,
  Info,
  Factory,
  Tag,
  ArrowRight
} from "lucide-react"
import { ImageUpload } from "@/components/ui/image-upload"
import API_CONFIG from "@/config/api"

// ========================================
// 1. VIEW PRODUCT MODAL - WITH EARLIEST EXPIRY DATE (FIFO)
// ========================================
export function ViewProductModal({ product, open, onOpenChange }) {
  if (!product) return null

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStockStatus = (product) => {
    // Composite products don't have stock tracking
    if (product.is_composite) {
      return { 
        status: 'composite', 
        color: 'bg-purple-100 text-purple-800 border-purple-200', 
        text: 'Composite Product',
        description: 'Stock based on ingredients'
      }
    }
    
    if (product.stock_quantity <= 0) {
      return { 
        status: 'out-of-stock', 
        color: 'bg-red-100 text-red-800 border-red-200', 
        text: 'Out of Stock',
        description: 'No stock available'
      }
    } else if (product.stock_quantity <= product.min_stock_level) {
      return { 
        status: 'low-stock', 
        color: 'bg-orange-100 text-orange-800 border-orange-200', 
        text: 'Low Stock',
        description: 'Below minimum level'
      }
    } else {
      return { 
        status: 'in-stock', 
        color: 'bg-green-100 text-green-800 border-green-200', 
        text: 'In Stock',
        description: 'Stock available'
      }
    }
  }

  const stockStatus = getStockStatus(product)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Product Details
          </DialogTitle>
          <DialogDescription>
            Viewing details for {product.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Image */}
          {product.image_url && (
            <div className="flex justify-center">
              <img 
                src={product.image_url} 
                alt={product.name}
                className="max-w-32 max-h-32 object-cover rounded-lg border"
                onError={(e) => {
                  ((e.target as HTMLImageElement).style.display) = 'none'
                }}
              />
            </div>
          )}

          {/* Product Type Badge */}
          {product.is_composite && (
            <Alert className="bg-purple-50 border-purple-200">
              <ChefHat className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-900">
                This is a <strong>composite product</strong> made from ingredients. 
                Stock is calculated based on available ingredients.
              </AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Product Name</p>
                <p className="text-sm font-medium">{product.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Product Type</p>
                <Badge className={product.is_composite ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}>
                  {product.is_composite ? (
                    <><Layers className="w-3 h-3 mr-1" />Composite</>
                  ) : (
                    <><Package className="w-3 h-3 mr-1" />Regular</>
                  )}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500">SKU</p>
                <p className="text-sm font-medium">{product.sku || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Barcode</p>
                <p className="text-sm font-medium">{product.barcode || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Category</p>
                <p className="text-sm font-medium">{product.category_name || 'Uncategorized'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Unit</p>
                <p className="text-sm font-medium">{product.unit || 'pcs'}</p>
              </div>
            </div>
            {product.description && (
              <div>
                <p className="text-xs text-gray-500">Description</p>
                <p className="text-sm">{product.description}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Pricing Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Pricing
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Default Price</p>
                <p className="text-sm font-medium">{formatCurrency(product.default_price)}</p>
              </div>
              {product.cost_price > 0 && (() => {
                const profit = product.default_price - product.cost_price
                const margin = (profit / product.default_price) * 100
                return (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Cost Price (Supplier)</p>
                    <p className="text-sm font-medium text-orange-600">{formatCurrency(product.cost_price)}</p>
                    <p className={`text-xs font-medium mt-1 ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Profit: {formatCurrency(profit)}
                      {' '}({margin >= 0 ? '+' : ''}{margin.toFixed(1)}% margin)
                    </p>
                  </div>
                )
              })()}
              {product.is_composite && product.recipe_cost > 0 && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Recipe Cost (Ingredients)</p>
                  <p className="text-sm font-medium text-purple-600">{formatCurrency(product.recipe_cost)}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Profit Margin: {formatCurrency(product.default_price - product.recipe_cost)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Stock Information - Different for composite vs regular */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Stock Information
            </h3>
            
            <div className="p-4 rounded-lg border" style={{borderColor: stockStatus.color.split(' ')[2]}}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Status</span>
                <Badge className={stockStatus.color}>
                  {stockStatus.text}
                </Badge>
              </div>
              <p className="text-xs text-gray-600">{stockStatus.description}</p>
            </div>

            {product.is_composite ? (
              // Composite Product Info
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900 text-xs">
                  This product is manufactured on-demand. Stock availability depends on ingredient levels. 
                  {product.recipe_cost > 0 ? " Recipe has been configured." : " Recipe needs to be configured."}
                </AlertDescription>
              </Alert>
            ) : (
              // Regular Product Stock
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Current Stock</p>
                  <p className="text-lg font-bold">{product.stock_quantity || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Min Level</p>
                  <p className="text-lg font-medium">{product.min_stock_level || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Max Level</p>
                  <p className="text-lg font-medium">{product.max_stock_level || 'N/A'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Expiry Date - For non-composite products */}
          {!product.is_composite && product.expiry_date && (() => {
            const expiry = new Date(product.expiry_date)
            const now = new Date()
            const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            const isExpired = daysUntil < 0
            const isExpiringSoon = daysUntil >= 0 && daysUntil <= 30
            return (
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Expiry Date</p>
                <p className={`text-sm font-medium ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-orange-600' : 'text-green-600'}`}>
                  {expiry.toLocaleDateString()}
                  {isExpired && ' (EXPIRED)'}
                  {isExpiringSoon && !isExpired && ` (${daysUntil} days left)`}
                </p>
              </div>
            )
          })()}

          {/* Manufacturing Information - UPDATED: Show EARLIEST expiring batch (FIFO) */}
          {product.is_composite && product.earliest_expiry_date && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Factory className="h-4 w-4" />
                  Earliest Expiring Batch (FIFO)
                  {product.total_batches > 1 && (
                    <Badge variant="outline" className="text-xs">
                      {product.total_batches} batches total
                    </Badge>
                  )}
                </h3>
                
                <Alert className="bg-orange-50 border-orange-200">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-900 text-xs">
                    <strong>First to Expire (FIFO):</strong> This batch should be sold first.
                    {product.total_batches > 1 && ` ${product.total_batches - 1} other batch${product.total_batches > 2 ? 'es' : ''} available.`}
                  </AlertDescription>
                </Alert>
                
                <div className="p-4 rounded-lg border border-purple-200 bg-purple-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Batch Number</p>
                      <p className="text-sm font-medium">{product.earliest_batch_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Production Date</p>
                      <p className="text-sm font-medium">
                        {product.earliest_production_date 
                          ? new Date(product.earliest_production_date).toLocaleDateString()
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-600">Expiry Date</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <p className="text-sm font-bold text-purple-900">
                          {new Date(product.earliest_expiry_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        {(() => {
                          const today = new Date();
                          const expiryDate = new Date(product.earliest_expiry_date);
                          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          
                          if (daysUntilExpiry < 0) {
                            return (
                              <Badge className="bg-red-100 text-red-800 border-red-200">
                                Expired
                              </Badge>
                            );
                          } else if (daysUntilExpiry <= 3) {
                            return (
                              <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                                Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}
                              </Badge>
                            );
                          } else if (daysUntilExpiry <= 7) {
                            return (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                {daysUntilExpiry} days left
                              </Badge>
                            );
                          } else {
                            return (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                Fresh
                              </Badge>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Show all batches if multiple */}
                {product.all_batches && product.all_batches.length > 1 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-700">All Batches:</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {product.all_batches.map((batch, index) => (
                        <div key={index} className="text-xs p-2 bg-gray-50 rounded flex items-center justify-between">
                          <span>
                            <strong>{batch.batch_number || `Batch ${index + 1}`}</strong>
                            {index === 0 && <Badge className="ml-2 text-xs bg-orange-100 text-orange-800">Expires First</Badge>}
                          </span>
                          <span className="text-gray-600">
                            {new Date(batch.expiry_date).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900 text-xs">
                    Showing the earliest expiring batch for FIFO (First In, First Out) inventory management.
                  </AlertDescription>
                </Alert>
              </div>
            </>
          )}

          <Separator />

          {/* Metadata */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Metadata
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-500">Created At</p>
                <p className="font-medium">{formatDate(product.created_at)}</p>
              </div>
              <div>
                <p className="text-gray-500">Last Updated</p>
                <p className="font-medium">{formatDate(product.updated_at)}</p>
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

// ========================================
// 2. EDIT PRODUCT MODAL
// ========================================
export function EditProductModal({ product, open, onOpenChange, onProductUpdated }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [categories, setCategories] = useState([])
  const [stores, setStores] = useState([])
  
  // Success modal state
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  
  // Composite state
  const [isComposite, setIsComposite] = useState(false)
  
  // Form data initialized with product data
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

  // Initialize form data when product changes
  useEffect(() => {
    if (product && open) {
      setIsComposite(product.is_composite || false)
      setFormData({
        name: product.name || "",
        description: product.description || "",
        sku: product.sku || "",
        barcode: product.barcode || "",
        category_id: product.category_id || "",
        store_id: product.store_id || "",
        default_price: product.default_price || "",
        manila_price: product.manila_price || "",
        delivery_price: product.delivery_price || "",
        wholesale_price: product.wholesale_price || "",
        cost_price: product.cost_price || "",
        expiry_date: product.expiry_date ? product.expiry_date.split('T')[0] : "",
        stock_quantity: product.stock_quantity || "",
        min_stock_level: product.min_stock_level || "",
        max_stock_level: product.max_stock_level || "",
        unit: product.unit || "pcs",
        weight: product.weight || "",
        image_url: product.image_url || ""
      })
      fetchCategories()
      fetchStores()
    }
  }, [product, open])

  // Reset when modal closes
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

  const fetchCategories = async () => {
    try {
      const data = await makeApiCall('/client/products/categories')
      if (data) {
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchStores = async () => {
    try {
      const data = await makeApiCall('/client/dashboard/stores')
      if (data) {
        setStores(data.stores || [])
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error)
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
      const data = await makeApiCall(`/client/products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...formData,
          is_composite: isComposite
        })
      })

      if (data) {
        const productType = isComposite ? "composite product" : "product"
        setSuccessMessage(`Product "${data.product.name}" has been successfully updated as a ${productType}!`)
        setShowSuccessDialog(true)
        
        if (onProductUpdated) {
          onProductUpdated(data.product)
        }

        setTimeout(() => {
          setShowSuccessDialog(false)
          onOpenChange(false)
        }, 1500)
      }

    } catch (error) {
      console.error('Update product error:', error)
      setError(error.message || 'Failed to update product. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!product) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Edit Product
            </DialogTitle>
            <DialogDescription>
              Update the details for {product.name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Product Type Selection */}
            <div className="space-y-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="is_composite_edit"
                  checked={isComposite}
                  onChange={(e) => handleCompositeChange(e.target.checked)}
                  className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  disabled={loading}
                />
                <div className="flex-1">
                  <label htmlFor="is_composite_edit" className="text-sm font-medium text-gray-900 flex items-center gap-2 cursor-pointer">
                    <ChefHat className="h-4 w-4 text-purple-600" />
                    This is a composite product (made from ingredients)
                  </label>
                  <p className="text-xs text-gray-600 mt-1">
                    Check this if the product is made from raw ingredients
                  </p>
                </div>
              </div>
              
              {isComposite && (
                <Alert className="bg-purple-100 border-purple-300">
                  <Info className="h-4 w-4 text-purple-700" />
                  <AlertDescription className="text-xs text-purple-900">
                    Stock tracking is disabled for composite products. Configure the recipe to define ingredients needed.
                  </AlertDescription>
                </Alert>
              )}
            </div>

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
                    disabled={loading}
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
                    disabled={loading}
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
                  disabled={loading}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category_id">Category</Label>
                  {categories.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => { onOpenChange(false); navigate('/client/inventory/categories') }}
                      className="w-full flex items-center justify-between gap-2 rounded-md border border-dashed border-orange-300 bg-orange-50 px-3 py-2.5 text-sm text-orange-700 hover:bg-orange-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 shrink-0" />
                        <span>No categories yet — tap to create one first</span>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </button>
                  ) : (
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => handleInputChange('category_id', value)}
                      disabled={loading}
                    >
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
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    placeholder="Barcode"
                    value={formData.barcode}
                    onChange={(e) => handleInputChange('barcode', e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
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
                    disabled={loading}
                    required
                  />
                </div>


                <div className="space-y-2">
                  <Label htmlFor="cost_price">
                    Cost Price {isComposite ? "(Auto from Recipe)" : "(Supplier)"}
                  </Label>
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    placeholder={isComposite ? "Calculated from recipe" : "0.00"}
                    value={formData.cost_price}
                    onChange={(e) => handleInputChange('cost_price', e.target.value)}
                    disabled={loading}
                    readOnly={isComposite}
                    className={isComposite ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}
                  />
                  {isComposite && (
                    <p className="text-xs text-blue-600">Auto-calculated from recipe ingredients. Edit via Recipe button.</p>
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
                <Label htmlFor="expiry_date_edit">Expiry Date <span className="text-gray-400 text-xs">(optional)</span></Label>
                <Input
                  id="expiry_date_edit"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => handleInputChange('expiry_date', e.target.value)}
                  disabled={loading}
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
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min_stock_level">Min Stock Level</Label>
                    <Input
                      id="min_stock_level"
                      type="number"
                      placeholder="0"
                      value={formData.min_stock_level}
                      onChange={(e) => handleInputChange('min_stock_level', e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_stock_level">Max Stock Level</Label>
                    <Input
                      id="max_stock_level"
                      type="number"
                      placeholder="0"
                      value={formData.max_stock_level}
                      onChange={(e) => handleInputChange('max_stock_level', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select 
                      value={formData.unit} 
                      onValueChange={(value) => handleInputChange('unit', value)}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="pack">Pack</SelectItem>
                        <SelectItem value="kg">Kilogram (kg)</SelectItem>
                        <SelectItem value="g">Gram (g)</SelectItem>
                        <SelectItem value="l">Liter (l)</SelectItem>
                        <SelectItem value="ml">Milliliter (ml)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (optional)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Product Image</Label>
              <ImageUpload
                value={formData.image_url}
                onChange={(url) => handleInputChange('image_url', url)}
                disabled={loading}
              />
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
                    Update Product
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-green-600">Success!</AlertDialogTitle>
            <AlertDialogDescription>{successMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ========================================
// 3. DELETE PRODUCT DIALOG
// ========================================
export function DeleteProductDialog({ product, open, onOpenChange, onProductDeleted }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/client/products/${product.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json()
        if (errorData.code === 'TOKEN_EXPIRED' || errorData.code === 'INVALID_TOKEN') {
          alert('Your session has expired. Please log in again.')
          window.location.href = '/login'
          return
        }
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete product')
      }

      if (onProductDeleted) {
        onProductDeleted(product.id)
      }

      onOpenChange(false)

    } catch (error) {
      console.error('Delete product error:', error)
      setError(error.message || 'Failed to delete product. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!product) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Delete Product
          </AlertDialogTitle>
          <AlertDialogDescription>
            <p className="mb-2">
              Are you sure you want to delete <strong>{product.name}</strong>?
            </p>
            <p className="text-sm text-gray-600">
              This action cannot be undone. The product will be permanently removed from your inventory.
            </p>
            {product.is_composite && (
              <Alert className="mt-3 bg-purple-50 border-purple-200">
                <Info className="h-4 w-4 text-purple-600" />
                <AlertDescription className="text-xs text-purple-900">
                  This is a composite product. Its recipe will also be deleted.
                </AlertDescription>
              </Alert>
            )}
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
                Delete Product
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}