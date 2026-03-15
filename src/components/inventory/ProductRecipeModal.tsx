import { formatCurrency } from '@/lib/utils'
// src/components/inventory/ProductRecipeModal.jsx

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
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SuccessModal } from "@/components/ui/success-modal"
import { 
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
  Beaker,
  DollarSign,
  Package,
  ChefHat
} from "lucide-react"
import API_CONFIG from "@/config/api"

export function ProductRecipeModal({ product, open, onOpenChange, onRecipeSaved }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [loadingIngredients, setLoadingIngredients] = useState(false)
  
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  
  // Available ingredients
  const [ingredients, setIngredients] = useState([])
  
  // Recipe items
  const [recipeItems, setRecipeItems] = useState([])
  
  // New item form
  const [newItem, setNewItem] = useState({
    ingredient_id: "",
    quantity_needed: "",
    unit: "",
    notes: ""
  })

  useEffect(() => {
    if (open && product) {
      fetchIngredients()
      fetchProductRecipe()
    }
  }, [open, product])

  useEffect(() => {
    if (!open) {
      setRecipeItems([])
      setNewItem({
        ingredient_id: "",
        quantity_needed: "",
        unit: "",
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

  const fetchIngredients = async () => {
    try {
      setLoadingIngredients(true)
      
      let endpoint = '/client/ingredients'
      if (product?.store_id) {
        endpoint += `?store_id=${product.store_id}`
      }

      const data = await makeApiCall(endpoint)
      
      if (data) {
        setIngredients(data.ingredients || [])
      }
    } catch (error) {
      console.error('Failed to fetch ingredients:', error)
    } finally {
      setLoadingIngredients(false)
    }
  }

  const fetchProductRecipe = async () => {
    try {
      const data = await makeApiCall(`/client/recipes/${product.id}`)
      
      if (data && data.recipe) {
        // Transform existing recipe to recipeItems format
        const items = data.recipe.map(item => ({
          ingredient_id: item.ingredient_id,
          ingredient_name: item.ingredients?.name || 'Unknown',
          quantity_needed: item.quantity_needed,
          unit: item.unit,
          unit_cost: item.ingredients?.unit_cost || 0,
          notes: item.notes || ""
        }))
        setRecipeItems(items)
      }
    } catch (error) {
      console.error('Failed to fetch recipe:', error)
    }
  }

  const handleAddItem = () => {
    if (!newItem.ingredient_id || !newItem.quantity_needed || !newItem.unit) {
      setError("Please select ingredient and enter quantity")
      return
    }

    // Check if ingredient already exists in recipe
    if (recipeItems.some(item => item.ingredient_id === newItem.ingredient_id)) {
      setError("This ingredient is already in the recipe")
      return
    }

    // Find ingredient details
    const ingredient = ingredients.find(ing => ing.id === newItem.ingredient_id)
    if (!ingredient) {
      setError("Invalid ingredient selected")
      return
    }

    // Add to recipe items
    const newRecipeItem = {
      ingredient_id: newItem.ingredient_id,
      ingredient_name: ingredient.name,
      quantity_needed: parseFloat(newItem.quantity_needed),
      unit: newItem.unit,
      unit_cost: ingredient.unit_cost,
      notes: newItem.notes
    }

    setRecipeItems(prev => [...prev, newRecipeItem])
    
    // Reset form
    setNewItem({
      ingredient_id: "",
      quantity_needed: "",
      unit: "",
      notes: ""
    })
    setError("")
  }

  const handleRemoveItem = (ingredientId) => {
    setRecipeItems(prev => prev.filter(item => item.ingredient_id !== ingredientId))
  }

  const handleIngredientSelect = (ingredientId) => {
    const ingredient = ingredients.find(ing => ing.id === ingredientId)
    if (ingredient) {
      setNewItem(prev => ({
        ...prev,
        ingredient_id: ingredientId,
        unit: ingredient.unit // Auto-fill unit from ingredient
      }))
    }
  }

  const calculateRecipeCost = () => {
    return recipeItems.reduce((sum, item) => {
      return sum + (item.quantity_needed * item.unit_cost)
    }, 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (recipeItems.length === 0) {
      setError("Please add at least one ingredient to the recipe")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Transform recipe items to API format
      const ingredients = recipeItems.map(item => ({
        ingredient_id: item.ingredient_id,
        quantity_needed: item.quantity_needed,
        unit: item.unit,
        notes: item.notes
      }))

      const data = await makeApiCall(`/client/recipes/${product.id}`, {
        method: 'POST',
        body: JSON.stringify({ ingredients })
      })

      if (data) {
        setSuccessMessage(`Recipe for "${product.name}" has been successfully saved!`)
        setShowSuccessModal(true)
        
        if (onRecipeSaved) {
          onRecipeSaved(product.id)
        }

        onOpenChange(false)
      }

    } catch (error) {
      console.error('Save recipe error:', error)
      setError(error.message || 'Failed to save recipe. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!product) return null

  const recipeCost = calculateRecipeCost()
  const profitMargin = product.default_price > 0 
    ? ((product.default_price - recipeCost) / product.default_price * 100).toFixed(2)
    : 0

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-blue-600" />
              Product Recipe - {product.name}
            </DialogTitle>
            <DialogDescription>
              Define ingredients and quantities needed to make this product
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

              {/* Product Info */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-600">Product Price</p>
                  <p className="text-lg font-semibold">{formatCurrency(product.default_price)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Recipe Cost</p>
                  <p className="text-lg font-semibold text-blue-600">{formatCurrency(recipeCost)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Profit Margin</p>
                  <p className={`text-lg font-semibold ${Number(profitMargin) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profitMargin}%
                  </p>
                </div>
              </div>

              {/* Add Ingredient Form */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Ingredient
                </h3>

                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-5">
                    <Label htmlFor="ingredient">Ingredient</Label>
                    <Select
                      value={newItem.ingredient_id}
                      onValueChange={handleIngredientSelect}
                      disabled={loadingIngredients}
                    >
                      <SelectTrigger id="ingredient">
                        <SelectValue placeholder="Select ingredient" />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredients.map(ingredient => (
                          <SelectItem 
                            key={ingredient.id} 
                            value={ingredient.id}
                            disabled={recipeItems.some(item => item.ingredient_id === ingredient.id)}
                          >
                            {ingredient.name} ({ingredient.stock_quantity} {ingredient.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-3">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      value={newItem.quantity_needed}
                      onChange={(e) => setNewItem(prev => ({ ...prev, quantity_needed: e.target.value }))}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      value={newItem.unit}
                      onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="g, ml, etc"
                    />
                  </div>

                  <div className="col-span-2 flex items-end">
                    <Button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Recipe Items Table */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Beaker className="h-4 w-4" />
                  Recipe Ingredients ({recipeItems.length})
                </h3>

                {recipeItems.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ingredient</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Cost</TableHead>
                          <TableHead>Total Cost</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recipeItems.map((item) => (
                          <TableRow key={item.ingredient_id}>
                            <TableCell className="font-medium">
                              {item.ingredient_name}
                            </TableCell>
                            <TableCell>
                              {item.quantity_needed} {item.unit}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(item.unit_cost)}/{item.unit}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(item.quantity_needed * item.unit_cost)}
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(item.ingredient_id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-gray-50">
                          <TableCell colSpan={3} className="font-semibold">
                            Total Recipe Cost
                          </TableCell>
                          <TableCell className="font-bold text-blue-600">
                            {formatCurrency(recipeCost)}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-lg bg-gray-50">
                    <Beaker className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No ingredients added yet</p>
                    <p className="text-xs text-gray-500">Add ingredients above to build your recipe</p>
                  </div>
                )}
              </div>

              {/* Cost Analysis */}
              {recipeItems.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                  <h4 className="text-sm font-semibold text-blue-900">Cost Analysis</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Recipe Cost:</span>
                      <span className="font-semibold">{formatCurrency(recipeCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Selling Price:</span>
                      <span className="font-semibold">{formatCurrency(product.default_price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Gross Profit:</span>
                      <span className={`font-semibold ${(product.default_price - recipeCost) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(product.default_price - recipeCost)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Profit Margin:</span>
                      <span className={`font-semibold ${Number(profitMargin) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profitMargin}%
                      </span>
                    </div>
                  </div>
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
              <Button type="submit" disabled={loading || recipeItems.length === 0}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <ChefHat className="mr-2 h-4 w-4" />
                    Save Recipe
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
        title="Recipe Saved!"
        description={successMessage}
      />
    </>
  )
}