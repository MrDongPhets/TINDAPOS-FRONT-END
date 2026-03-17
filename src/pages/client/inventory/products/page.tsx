import { formatCurrency } from '@/lib/utils'
// src/app/client/inventory/products/page.jsx - Complete with FIFO expiry

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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  Barcode,
  Store,
  ChefHat,
  Factory,
  Calendar
} from "lucide-react"
import { SimpleStoreSelector } from "@/components/store/SimpleStoreSelector"
import { useStores } from "@/hooks/useStores"
import { AddProductModal } from "@/components/inventory/AddProductModal"
import { 
  ViewProductModal,
  EditProductModal,
  DeleteProductDialog
} from "@/components/inventory/ProductActionsModals"
import { ProductRecipeModal } from "@/components/inventory/ProductRecipeModal"
import { ManufactureProductModal } from "@/components/inventory/ManufactureProductModal"
import StockAdjustmentModal from "@/components/inventory/StockAdjustmentModal"
import API_CONFIG from "@/config/api"
import { UserMenuDropdown } from "@/components/ui/UserMenuDropdown"

export default function ProductsPage() {
  const [user, setUser] = useState(null)
  const [company, setCompany] = useState(null)
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
  
  // Products data
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [totalProducts, setTotalProducts] = useState(0)

  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  
  // Modal states
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showRecipeModal, setShowRecipeModal] = useState(false)
  const [showManufactureModal, setShowManufactureModal] = useState(false)
  const [showAdjustStockModal, setShowAdjustStockModal] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('userData')
    const companyData = localStorage.getItem('companyData')
    
    if (userData) setUser(JSON.parse(userData))
    if (companyData) setCompany(JSON.parse(companyData))

    fetchStores()
  }, [])

  useEffect(() => {
    if (stores.length > 0) {
      fetchProducts()
      fetchCategories()
    } else if (!storesLoading) {
      // Stores finished loading but none exist — stop spinner
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
          localStorage.removeItem('authToken')
          localStorage.removeItem('userData')
          localStorage.removeItem('userType')
          localStorage.removeItem('companyData')
          localStorage.removeItem('subscriptionData')
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

  const fetchProducts = async () => {
    try {
      setError(null)
      setLoading(true)
      
      let endpoint = '/client/products'
      
      if (viewMode === 'single' && selectedStore?.id) {
        endpoint += `?store_id=${selectedStore.id}`
      }
      
      const data = await makeApiCall(endpoint)
      
      if (data) {
        setProducts(data.products || [])
        setTotalProducts(data.products?.length || 0)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
      setError('Failed to load products. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchCategories = async () => {
    try {
      let endpoint = '/client/categories'
      
      if (viewMode === 'single' && selectedStore?.id) {
        endpoint += `?store_id=${selectedStore.id}`
      }
      
      const data = await makeApiCall(endpoint)
      if (data) {
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchProducts()
  }

  const handleProductAdded = (newProduct) => {
    setProducts(prev => [newProduct, ...prev])
    setTotalProducts(prev => prev + 1)
  }

  const handleProductUpdated = (updatedProduct) => {
    setProducts(prev => prev.map(product => 
      product.id === updatedProduct.id ? updatedProduct : product
    ))
  }

  const handleProductDeleted = (deletedProductId) => {
    setProducts(prev => prev.filter(product => product.id !== deletedProductId))
    setTotalProducts(prev => prev - 1)
  }

  const handleViewProduct = (product) => {
    setSelectedProduct(product)
    setShowViewModal(true)
  }

  const handleEditProduct = (product) => {
    setSelectedProduct(product)
    setShowEditModal(true)
  }

  const handleDeleteProduct = (product) => {
    setSelectedProduct(product)
    setShowDeleteDialog(true)
  }

  const handleManageRecipe = (product) => {
    setSelectedProduct(product)
    setShowRecipeModal(true)
  }

  const handleManufacture = (product) => {
    setSelectedProduct(product)
    setShowManufactureModal(true)
  }

  const getStockStatus = (product) => {
    if (product.stock_quantity <= 0) {
      return { status: 'out-of-stock', color: 'bg-red-100 text-red-800 border-red-200', text: 'Out of Stock', icon: XCircle }
    } else if (product.stock_quantity <= product.min_stock_level) {
      return { status: 'low-stock', color: 'bg-orange-100 text-orange-800 border-orange-200', text: 'Low Stock', icon: AlertCircle }
    } else {
      return { status: 'in-stock', color: 'bg-green-100 text-green-800 border-green-200', text: 'In Stock', icon: CheckCircle }
    }
  }

  // Aggregate products by SKU when viewing all stores
  const aggregateProductsBySkuIfNeeded = (products) => {
    if (viewMode !== 'all') {
      return products;
    }

    const productMap = new Map();

    products.forEach(product => {
      const key = product.sku || product.id;
      
      if (productMap.has(key)) {
        const existing = productMap.get(key);
        existing.stock_quantity += product.stock_quantity || 0;
        existing.store_count = (existing.store_count || 1) + 1;
        existing.stores = existing.stores || [];
        existing.stores.push({
          store_id: product.store_id,
          stock: product.stock_quantity || 0
        });
      } else {
        productMap.set(key, {
          ...product,
          store_count: 1,
          stores: [{
            store_id: product.store_id,
            stock: product.stock_quantity || 0
          }]
        });
      }
    });

    return Array.from(productMap.values());
  };

  const filteredProducts = aggregateProductsBySkuIfNeeded(products).filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory
    
    const stockStatus = getStockStatus(product)
    const matchesStock = stockFilter === "all" ||
                        (stockFilter === "low-stock" && stockStatus.status === "low-stock") ||
                        (stockFilter === "out-of-stock" && stockStatus.status === "out-of-stock") ||
                        (stockFilter === "in-stock" && stockStatus.status === "in-stock")
    
    return matchesSearch && matchesCategory && matchesStock
  })

  const nonCompositeProducts = filteredProducts.filter(p => !p.is_composite)

  if (loading && stores.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  if (!storesLoading && stores.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <Store className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No Store Yet</h2>
          <p className="text-gray-600 mb-6">
            You need to create a store before you can manage products.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/client/stores">
              <Button className="bg-[#E8302A] hover:bg-[#B91C1C]">
                <Store className="mr-2 h-4 w-4" />
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
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Products</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} className="bg-[#E8302A] hover:bg-[#B91C1C]">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar userType="client" user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b overflow-hidden">
          <div className="flex items-center gap-2 px-4 shrink-0">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/client/dashboard">Business</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/client/inventory">Inventory</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Products</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="ml-auto px-4 flex items-center gap-2 min-w-0 overflow-hidden">
            <SimpleStoreSelector
              stores={stores}
              selectedStore={selectedStore}
              onStoreSelect={selectStore}
              viewMode={viewMode}
              onToggleViewMode={toggleViewMode}
              loading={false}
            />
            <UserMenuDropdown />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 pb-24">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
            <div className="hidden md:block">
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <Package className="h-6 w-6 text-blue-600" />
                Products Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your inventory • {filteredProducts.length} products
                {viewMode === 'single' && selectedStore && ` • ${selectedStore.name}`}
                {viewMode === 'all' && ' • All Stores (Aggregated)'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-3.5 md:p-5 flex items-center justify-between gap-2 shadow-sm">
              <div className="min-w-0">
                <p className="text-xs font-medium text-white/80 truncate">Total</p>
                <p className="text-xl md:text-2xl font-bold text-white mt-0.5 truncate leading-tight">{filteredProducts.length}</p>
                <p className="text-[11px] text-white/70 mt-0.5 truncate">All products</p>
              </div>
              <Package className="h-8 w-8 md:h-10 md:w-10 text-white/30 shrink-0" />
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-3.5 md:p-5 flex items-center justify-between gap-2 shadow-sm">
              <div className="min-w-0">
                <p className="text-xs font-medium text-white/80 truncate">In Stock</p>
                <p className="text-xl md:text-2xl font-bold text-white mt-0.5 truncate leading-tight">
                  {nonCompositeProducts.filter(p => getStockStatus(p).status === 'in-stock').length}
                </p>
                <p className="text-[11px] text-white/70 mt-0.5 truncate">Well stocked</p>
              </div>
              <Package className="h-8 w-8 md:h-10 md:w-10 text-white/30 shrink-0" />
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-3.5 md:p-5 flex items-center justify-between gap-2 shadow-sm">
              <div className="min-w-0">
                <p className="text-xs font-medium text-white/80 truncate">Low Stock</p>
                <p className="text-xl md:text-2xl font-bold text-white mt-0.5 truncate leading-tight">
                  {filteredProducts.filter(p => getStockStatus(p).status === 'low-stock').length}
                </p>
                <p className="text-[11px] text-white/70 mt-0.5 truncate">Need reordering</p>
              </div>
              <AlertCircle className="h-8 w-8 md:h-10 md:w-10 text-white/30 shrink-0" />
            </div>

            <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-3.5 md:p-5 flex items-center justify-between gap-2 shadow-sm">
              <div className="min-w-0">
                <p className="text-xs font-medium text-white/80 truncate">Out of Stock</p>
                <p className="text-xl md:text-2xl font-bold text-white mt-0.5 truncate leading-tight">
                  {filteredProducts.filter(p => getStockStatus(p).status === 'out-of-stock').length}
                </p>
                <p className="text-[11px] text-white/70 mt-0.5 truncate">Action required</p>
              </div>
              <AlertCircle className="h-8 w-8 md:h-10 md:w-10 text-white/30 shrink-0" />
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>Products List</CardTitle>
                <div className="flex flex-wrap justify-end items-center gap-2">
                  <AddProductModal onProductAdded={handleProductAdded} />
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search products..."
                      className="pl-8 w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={stockFilter} onValueChange={setStockFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Stock Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stock</SelectItem>
                      <SelectItem value="in-stock">In Stock</SelectItem>
                      <SelectItem value="low-stock">Low Stock</SelectItem>
                      <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : filteredProducts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="hidden md:table-cell">Category</TableHead>
                      <TableHead className="hidden xl:table-cell">SKU</TableHead>
                      <TableHead className="hidden sm:table-cell">Price</TableHead>
                      <TableHead className="hidden xl:table-cell">Cost Price</TableHead>
                      <TableHead className="hidden md:table-cell">Stock</TableHead>
                      <TableHead className="hidden xl:table-cell">Expiry Date</TableHead>
                      <TableHead className="hidden lg:table-cell">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product)
                      
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="h-10 w-10 rounded-lg object-cover shrink-0"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                  <ImageIcon className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-semibold text-gray-900 flex items-center gap-2">
                                  {product.name}
                                  {product.is_composite && (
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                      <ChefHat className="h-3 w-3 mr-1" />
                                      Recipe
                                    </Badge>
                                  )}
                                </div>
                                {/* Mobile-only sub-info */}
                                <div className="sm:hidden mt-0.5 flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-gray-700">{formatCurrency(product.default_price)}</span>
                                  <Badge className={`text-xs ${stockStatus.color}`}>
                                    <stockStatus.icon className="w-3 h-3 sm:mr-1" />
                                    <span className="hidden sm:inline">{stockStatus.text}</span>
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {product.categories ? (
                              <Badge
                                variant="outline"
                                style={{
                                  backgroundColor: `${product.categories.color}20`,
                                  borderColor: product.categories.color,
                                  color: product.categories.color
                                }}
                              >
                                {product.categories.name}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-sm">No category</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            <div className="flex items-center gap-1 text-sm">
                              <Barcode className="h-3 w-3 text-gray-400" />
                              <span className="font-mono">{product.sku || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="font-semibold">{formatCurrency(product.default_price)}</div>
                            {product.cost_price > 0 && (() => {
                              const margin = ((product.default_price - product.cost_price) / product.default_price) * 100
                              return (
                                <div className={`text-xs ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {margin >= 0 ? '+' : ''}{margin.toFixed(1)}% margin
                                </div>
                              )
                            })()}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {product.cost_price > 0 ? (
                              <div className="font-medium text-orange-600">{formatCurrency(product.cost_price)}</div>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {product.is_composite ? (
                              product.stock_quantity > 0 ? (
                                // Composite product WITH manufactured stock
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">{product.stock_quantity || 0}</span>
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                                      Pre-made
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1">
                                    Can also make to order
                                  </div>
                                </div>
                              ) : (
                                // Composite product WITHOUT manufactured stock (made to order only)
                                <div className="text-sm">
                                  <span className="text-gray-500 italic">Made to order</span>
                                  <div className="text-xs text-gray-400 mt-1">
                                    Based on ingredients
                                  </div>
                                </div>
                              )
                            ) : (
                              // Regular product with stock tracking
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="cursor-help">
                                      <span className="font-semibold">{product.stock_quantity || 0}</span>
                                      <span className="text-gray-400 text-sm"> / {product.max_stock_level || 0}</span>
                                      {viewMode === 'all' && product.store_count > 1 && (
                                        <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                          <Store className="h-3 w-3" />
                                          {product.store_count} stores
                                        </div>
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  {viewMode === 'all' && product.stores && product.stores.length > 1 && (
                                    <TooltipContent>
                                      <div className="space-y-1">
                                        <p className="font-semibold text-xs mb-2">Stock by Store:</p>
                                        {product.stores.map((store, idx) => (
                                          <div key={idx} className="text-xs flex justify-between gap-4">
                                            <span className="text-gray-400">
                                              {stores.find(s => s.id === store.store_id)?.name || 'Unknown'}
                                            </span>
                                            <span className="font-semibold">{store.stock}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {product.is_composite && product.earliest_expiry_date ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3 text-gray-400" />
                                  <span className="text-sm font-medium">
                                    {new Date(product.earliest_expiry_date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>
                                {(() => {
                                  const today = new Date();
                                  const expiryDate = new Date(product.earliest_expiry_date);
                                  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                  
                                  if (daysUntilExpiry < 0) {
                                    return (
                                      <Badge className="bg-red-100 text-red-800 border-red-200 text-xs w-fit">
                                        Expired
                                      </Badge>
                                    );
                                  } else if (daysUntilExpiry <= 3) {
                                    return (
                                      <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs w-fit">
                                        {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}
                                      </Badge>
                                    );
                                  } else if (daysUntilExpiry <= 7) {
                                    return (
                                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs w-fit">
                                        {daysUntilExpiry} days
                                      </Badge>
                                    );
                                  } else {
                                    return (
                                      <span className="text-xs text-gray-500">
                                        {daysUntilExpiry} days left
                                      </span>
                                    );
                                  }
                                })()}
                                {product.earliest_batch_number && (
                                  <span className="text-xs text-gray-400">
                                    Batch: {product.earliest_batch_number}
                                  </span>
                                )}
                                {product.total_batches > 1 && (
                                  <span className="text-xs text-purple-600 font-medium">
                                    +{product.total_batches - 1} more batch{product.total_batches > 2 ? 'es' : ''}
                                  </span>
                                )}
                              </div>
                            ) : product.is_composite ? (
                              <span className="text-sm text-gray-400 italic">Made to order</span>
                            ) : !product.is_composite && product.expiry_date ? (() => {
                              const expiry = new Date(product.expiry_date)
                              const now = new Date()
                              const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                              const isExpired = daysUntil < 0
                              const isExpiringSoon = daysUntil >= 0 && daysUntil <= 30
                              return (
                                <div>
                                  <div className={`text-xs font-medium ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-orange-600' : 'text-green-600'}`}>
                                    {expiry.toLocaleDateString()}
                                  </div>
                                  {isExpired && <div className="text-xs text-red-500">EXPIRED</div>}
                                  {isExpiringSoon && !isExpired && <div className="text-xs text-orange-500">{daysUntil}d left</div>}
                                </div>
                              )
                            })() : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {product.is_composite ? (
                              product.stock_quantity > 0 ? (
                                // Has manufactured stock
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  {product.stock_quantity} Ready
                                </Badge>
                              ) : (
                                // Made to order only
                                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                  Made to Order
                                </Badge>
                              )
                            ) : (
                              // Regular product stock status
                              <Badge className={stockStatus.color}>
                                <stockStatus.icon className="w-3 h-3 sm:mr-1" />
                                <span className="hidden sm:inline">{stockStatus.text}</span>
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                
                                <DropdownMenuItem 
                                  onClick={() => handleViewProduct(product)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                
                                {product.is_composite && (
                                  <DropdownMenuItem
                                    onClick={() => handleManageRecipe(product)}
                                  >
                                    <ChefHat className="mr-2 h-4 w-4" />
                                    Manage Recipe
                                  </DropdownMenuItem>
                                )}
                                
                                {product.is_composite && (
                                  <DropdownMenuItem
                                    onClick={() => handleManufacture(product)}
                                  >
                                    <Factory className="mr-2 h-4 w-4" />
                                    Manufacture
                                  </DropdownMenuItem>
                                )}

                                {!product.is_composite && (
                                  <DropdownMenuItem
                                    onClick={() => { setSelectedProduct(product); setShowAdjustStockModal(true) }}
                                  >
                                    <Package className="mr-2 h-4 w-4" />
                                    Adjust Stock
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />
                                
                                <DropdownMenuItem 
                                  onClick={() => handleEditProduct(product)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Product
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteProduct(product)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Product
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
                  <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || selectedCategory !== "all" || stockFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Get started by adding your first product"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {selectedProduct && (
          <>
            <ViewProductModal
              product={selectedProduct}
              open={showViewModal}
              onOpenChange={setShowViewModal}
            />
            <EditProductModal
              product={selectedProduct}
              open={showEditModal}
              onOpenChange={setShowEditModal}
              onProductUpdated={handleProductUpdated}
            />
            <DeleteProductDialog
              product={selectedProduct}
              open={showDeleteDialog}
              onOpenChange={setShowDeleteDialog}
              onProductDeleted={handleProductDeleted}
            />
            <ProductRecipeModal
              product={selectedProduct}
              open={showRecipeModal}
              onOpenChange={setShowRecipeModal}
              onRecipeSaved={handleRefresh}
            />
            <ManufactureProductModal
              product={selectedProduct}
              open={showManufactureModal}
              onOpenChange={setShowManufactureModal}
              onManufactured={handleRefresh}
            />
            <StockAdjustmentModal
              product={selectedProduct}
              open={showAdjustStockModal}
              onOpenChange={setShowAdjustStockModal}
              onStockUpdated={handleRefresh}
            />
          </>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}