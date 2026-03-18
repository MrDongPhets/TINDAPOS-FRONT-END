import { formatCurrency } from '@/lib/utils'
// src/app/client/inventory/ingredients/page.jsx

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/ui/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Beaker,
  Plus,
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Package,
  ArrowUpCircle,
  ArrowDownCircle
} from "lucide-react"
import { SimpleStoreSelector } from "@/components/store/SimpleStoreSelector"
import { useStores } from "@/hooks/useStores"
import { AddIngredientModal } from "@/components/inventory/AddIngredientModal"
import { 
  ViewIngredientModal,
  EditIngredientModal,
  DeleteIngredientDialog,
  StockAdjustmentModal
} from "@/components/inventory/IngredientActionsModals"
import API_CONFIG from "@/config/api"
import { UserMenuDropdown } from "@/components/ui/UserMenuDropdown"

export default function IngredientsPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  
  // Store management
  const {
    stores,
    selectedStore,
    viewMode,
    loading: storesLoading,
    selectStore,
    toggleViewMode,
    fetchStores,
  } = useStores()
  
  // Ingredients data
  const [ingredients, setIngredients] = useState([])
  const [totalIngredients, setTotalIngredients] = useState(0)
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState("")
  const [stockFilter, setStockFilter] = useState("all")
  
  // Modal states
  const [selectedIngredient, setSelectedIngredient] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('userData')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchStores()
  }, [])

  useEffect(() => {
    if (stores.length > 0) {
      fetchIngredients()
    } else if (!storesLoading) {
      setLoading(false)
    }
  }, [stores, selectedStore, viewMode, storesLoading])

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
      setLoading(true)
      setError(null)

      let endpoint = '/client/ingredients'
      
      if (viewMode === 'single' && selectedStore?.id) {
        endpoint += `?store_id=${selectedStore.id}`
      }

      const data = await makeApiCall(endpoint)
      
      if (data) {
        setIngredients(data.ingredients || [])
        setTotalIngredients(data.count || 0)
      }
    } catch (error) {
      console.error('Failed to fetch ingredients:', error)
      setError('Failed to load ingredients. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchIngredients()
  }

  const handleIngredientAdded = (newIngredient) => {
    setIngredients(prev => [newIngredient, ...prev])
    setTotalIngredients(prev => prev + 1)
  }

  const handleIngredientUpdated = (updatedIngredient) => {
    setIngredients(prev => prev.map(ingredient => 
      ingredient.id === updatedIngredient.id ? updatedIngredient : ingredient
    ))
  }

  const handleIngredientDeleted = (deletedIngredientId) => {
    setIngredients(prev => prev.filter(ingredient => ingredient.id !== deletedIngredientId))
    setTotalIngredients(prev => prev - 1)
  }

  const handleStockUpdated = () => {
    fetchIngredients()
  }

  const handleViewIngredient = (ingredient) => {
    setSelectedIngredient(ingredient)
    setShowViewModal(true)
  }

  const handleEditIngredient = (ingredient) => {
    setSelectedIngredient(ingredient)
    setShowEditModal(true)
  }

  const handleDeleteIngredient = (ingredient) => {
    setSelectedIngredient(ingredient)
    setShowDeleteDialog(true)
  }

  const handleAdjustStock = (ingredient) => {
    setSelectedIngredient(ingredient)
    setShowStockModal(true)
  }

  const getStockStatus = (ingredient) => {
    if (ingredient.stock_quantity <= 0) {
      return { status: 'out', color: 'bg-red-100 text-red-800 border-red-200', text: 'Out of Stock', icon: XCircle }
    } else if (ingredient.stock_quantity <= ingredient.min_stock_level) {
      return { status: 'low', color: 'bg-orange-100 text-orange-800 border-orange-200', text: 'Low Stock', icon: AlertCircle }
    } else {
      return { status: 'good', color: 'bg-green-100 text-green-800 border-green-200', text: 'In Stock', icon: CheckCircle }
    }
  }

  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ingredient.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const stockStatus = getStockStatus(ingredient)
    const matchesStock = stockFilter === "all" ||
                        (stockFilter === "low" && stockStatus.status === "low") ||
                        (stockFilter === "out" && stockStatus.status === "out") ||
                        (stockFilter === "good" && stockStatus.status === "good")
    
    return matchesSearch && matchesStock
  })

  const stats = {
    total: filteredIngredients.length,
    inStock: filteredIngredients.filter(i => getStockStatus(i).status === 'good').length,
    lowStock: filteredIngredients.filter(i => getStockStatus(i).status === 'low').length,
    outOfStock: filteredIngredients.filter(i => getStockStatus(i).status === 'out').length,
    totalValue: filteredIngredients.reduce((sum, i) => sum + (i.unit_cost * i.stock_quantity), 0)
  }

  if (loading && stores.length === 0) {
    return (
      <SidebarProvider>
        <AppSidebar userType="client" user={user} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 px-4">
            <div className="h-5 w-5 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-36 rounded bg-gray-200 animate-pulse ml-2" />
            <div className="ml-auto flex gap-2">
              <div className="h-8 w-28 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
            </div>
          </header>
          <div className="flex flex-col gap-4 p-4 pt-0">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => <div key={i} className="rounded-2xl bg-gray-200 animate-pulse h-24" />)}
            </div>
            <div className="rounded-xl border bg-white p-4 animate-pulse space-y-3">
              <div className="flex justify-between mb-2">
                <div className="h-4 w-40 bg-gray-200 rounded" />
                <div className="h-8 w-28 bg-gray-200 rounded" />
              </div>
              <div className="flex gap-2 mb-3">
                <div className="h-9 flex-1 bg-gray-100 rounded" />
                <div className="h-9 w-9 bg-gray-100 rounded" />
              </div>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex gap-3 items-center py-2">
                  <div className="h-10 w-10 rounded bg-gray-200" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-32 bg-gray-200 rounded" />
                    <div className="h-3 w-20 bg-gray-100 rounded" />
                  </div>
                  <div className="h-5 w-16 bg-gray-100 rounded-full" />
                  <div className="h-4 w-12 bg-gray-100 rounded" />
                  <div className="h-8 w-8 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (!storesLoading && stores.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <Beaker className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No Store Yet</h2>
          <p className="text-gray-600 mb-6">
            You need to create a store before you can manage ingredients.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/client/stores">
              <Button className="bg-[#E8302A] hover:bg-[#B91C1C]">
                Go to Stores
              </Button>
            </Link>
            <Link to="/client/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Ingredients</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/client/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/client/inventory">Inventory</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Ingredients</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-2">
            <SimpleStoreSelector />
            <UserMenuDropdown />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 pb-24">
          <div className="hidden md:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <Beaker className="h-6 w-6 text-blue-600" />
                Ingredients Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your raw materials • {filteredIngredients.length} ingredients
                {viewMode === 'single' && selectedStore && ` • ${selectedStore.name}`}
                {viewMode === 'all' && ' • All Stores'}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
              <p className="text-white/80 text-sm font-medium">Total</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
              <div className="flex items-center gap-1 mt-2 text-white/70 text-xs">
                <Beaker className="h-3.5 w-3.5" />
                <span>Ingredients</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
              <p className="text-white/80 text-sm font-medium">In Stock</p>
              <p className="text-3xl font-bold mt-1">{stats.inStock}</p>
              <div className="flex items-center gap-1 mt-2 text-white/70 text-xs">
                <Package className="h-3.5 w-3.5" />
                <span>Sufficient</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-4 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
              <p className="text-white/80 text-sm font-medium">Low Stock</p>
              <p className="text-3xl font-bold mt-1">{stats.lowStock}</p>
              <div className="flex items-center gap-1 mt-2 text-white/70 text-xs">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Need restocking</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-4 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
              <p className="text-white/80 text-sm font-medium">Out of Stock</p>
              <p className="text-3xl font-bold mt-1">{stats.outOfStock}</p>
              <div className="flex items-center gap-1 mt-2 text-white/70 text-xs">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Empty</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-4 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
              <p className="text-white/80 text-sm font-medium">Total Value</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(stats.totalValue)}</p>
              <div className="flex items-center gap-1 mt-2 text-white/70 text-xs">
                <Package className="h-3.5 w-3.5" />
                <span>Stock value</span>
              </div>
            </div>
          </div>

          {/* Ingredients Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Ingredients List</CardTitle>
                <AddIngredientModal
                  onIngredientAdded={handleIngredientAdded}
                  trigger={
                    <Button className="bg-[#E8302A] hover:bg-[#B91C1C] shrink-0">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1.5">Add Ingredient</span>
                    </Button>
                  }
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search ingredients..."
                    className="pl-8 bg-gray-50 border-gray-200 rounded-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className={stockFilter !== "all" ? "border-[#E8302A] text-[#E8302A]" : ""}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-56">
                    <p className="text-sm font-medium mb-3">Filters</p>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Stock Status</p>
                      <Select value={stockFilter} onValueChange={setStockFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="good">In Stock</SelectItem>
                          <SelectItem value="low">Low Stock</SelectItem>
                          <SelectItem value="out">Out of Stock</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {stockFilter !== "all" && (
                      <Button variant="ghost" size="sm" className="w-full text-gray-500 text-xs mt-2"
                        onClick={() => setStockFilter("all")}>Clear filters</Button>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : filteredIngredients.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingredient</TableHead>
                      <TableHead className="hidden lg:table-cell">SKU</TableHead>
                      <TableHead className="hidden md:table-cell">Unit Cost</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead className="hidden lg:table-cell">Min Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden xl:table-cell">Supplier</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIngredients.map((ingredient) => {
                      const stockStatus = getStockStatus(ingredient)
                      
                      return (
                        <TableRow key={ingredient.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div className="font-semibold text-gray-900">{ingredient.name}</div>
                              {ingredient.description && (
                                <div className="text-xs text-gray-500 truncate max-w-xs">
                                  {ingredient.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {ingredient.sku}
                            </code>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="font-medium">{formatCurrency(ingredient.unit_cost)}</div>
                            <div className="text-xs text-gray-500">per {ingredient.unit}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold">
                              {ingredient.stock_quantity} {ingredient.unit}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {ingredient.min_stock_level} {ingredient.unit}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${stockStatus.color} border`}>
                              <stockStatus.icon className="w-3 h-3 sm:mr-1" />
                              <span className="hidden sm:inline">{stockStatus.text}</span>
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            <div className="text-sm text-gray-600">
                              {ingredient.supplier || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleViewIngredient(ingredient)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAdjustStock(ingredient)}>
                                  <ArrowUpCircle className="mr-2 h-4 w-4" />
                                  Adjust Stock
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleEditIngredient(ingredient)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteIngredient(ingredient)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <Beaker className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'No ingredients found' : 'No ingredients yet'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm 
                      ? 'Try adjusting your search terms'
                      : 'Get started by adding your first ingredient'}
                  </p>
                  {!searchTerm && <AddIngredientModal onIngredientAdded={handleIngredientAdded} />}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modals */}
        {selectedIngredient && (
          <>
            <ViewIngredientModal
              ingredient={selectedIngredient}
              open={showViewModal}
              onOpenChange={setShowViewModal}
            />
            <EditIngredientModal
              ingredient={selectedIngredient}
              open={showEditModal}
              onOpenChange={setShowEditModal}
              onIngredientUpdated={handleIngredientUpdated}
            />
            <DeleteIngredientDialog
              ingredient={selectedIngredient}
              open={showDeleteDialog}
              onOpenChange={setShowDeleteDialog}
              onIngredientDeleted={handleIngredientDeleted}
            />
            <StockAdjustmentModal
              ingredient={selectedIngredient}
              open={showStockModal}
              onOpenChange={setShowStockModal}
              onStockUpdated={handleStockUpdated}
            />
          </>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}