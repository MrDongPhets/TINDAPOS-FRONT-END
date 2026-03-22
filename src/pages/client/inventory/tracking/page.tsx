// src/app/client/inventory/tracking/page.jsx

'use client'

import { useState, useEffect } from 'react'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  BarChart3,
  Search,
  SlidersHorizontal,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Package,
  AlertTriangle,
  Plus,
  Minus,
  RotateCcw,
  Layers
} from "lucide-react"
import StockAdjustmentModal from '@/components/inventory/StockAdjustmentModal'
import API_CONFIG from '@/config/api';
import { UserMenuDropdown } from "@/components/ui/UserMenuDropdown"

export default function InventoryTrackingPage() {
  const [user, setUser] = useState(null)
  const [products, setProducts] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [movementFilter, setMovementFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('today')
  const [itemTypeFilter, setItemTypeFilter] = useState('all')
  const [stockStatusFilter, setStockStatusFilter] = useState('all')
  
  // Modal states
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('userData')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchProducts(),
        fetchMovements()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_CONFIG.BASE_URL}/client/products`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchMovements = async () => {
    try {
      const token = localStorage.getItem('authToken')
      
      // Fetch both product movements and ingredient movements
      const [productMovements, ingredientMovements] = await Promise.all([
        fetch(`${API_CONFIG.BASE_URL}/client/inventory/movements`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.ok ? res.json() : { movements: [] }),
        
        fetch(`${API_CONFIG.BASE_URL}/client/ingredients/movements`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.ok ? res.json() : { movements: [] })
      ])

      // Combine and format movements
      const allMovements = [
        ...(productMovements.movements || []).map(m => ({
          ...m,
          item_type: 'product',
          item_name: m.product_name,
          display_type: m.reference_type === 'manufacturing' ? 'manufacturing' : m.movement_type
        })),
        ...(ingredientMovements.movements || []).map(m => ({
          ...m,
          item_type: 'ingredient',
          item_name: m.ingredient_name,
          display_type: m.movement_type === 'usage' ? 'usage' : m.movement_type
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setMovements(allMovements)
    } catch (error) {
      console.error('Error fetching movements:', error)
    }
  }

  const getStockStatus = (product) => {
    // Composite products don't have direct stock tracking
    if (product.is_composite) {
      return {
        status: 'composite',
        color: 'bg-purple-100 text-purple-800',
        text: 'Composite Product',
        icon: Layers
      }
    }
    
    if (product.stock_quantity <= 0) {
      return { 
        status: 'out-of-stock', 
        color: 'bg-red-100 text-red-800', 
        text: 'Out of Stock',
        icon: AlertTriangle 
      }
    } else if (product.stock_quantity <= product.min_stock_level) {
      return { 
        status: 'low-stock', 
        color: 'bg-orange-100 text-orange-800', 
        text: 'Low Stock',
        icon: TrendingDown
      }
    } else {
      return { 
        status: 'in-stock', 
        color: 'bg-green-100 text-green-800', 
        text: 'In Stock',
        icon: TrendingUp
      }
    }
  }

  const getMovementIcon = (type) => {
    const iconMap = {
      'in': ArrowUpCircle,
      'out': ArrowDownCircle,
      'adjustment': RotateCcw,
      'transfer': Package,
      'usage': Minus,
      'manufacturing': Plus
    }
    return iconMap[type] || Package
  }

  const getMovementColor = (type) => {
    const colorMap = {
      'in': 'text-green-600',
      'out': 'text-red-600',
      'adjustment': 'text-blue-600',
      'transfer': 'text-purple-600',
      'usage': 'text-orange-600',
      'manufacturing': 'text-emerald-600'
    }
    return colorMap[type] || 'text-gray-600'
  }

  const getMovementTypeLabel = (type) => {
    const labelMap = {
      'in': 'Stock In',
      'out': 'Stock Out',
      'adjustment': 'Adjustment',
      'transfer': 'Transfer',
      'usage': 'Used (Manufacturing)',
      'manufacturing': 'Manufactured'
    }
    return labelMap[type] || type
  }

  const handleStockAdjustment = (product) => {
    if (product.is_composite) {
      alert('Cannot adjust stock for composite products. Please manufacture or adjust ingredients.')
      return
    }
    setSelectedProduct(product)
    setShowAdjustmentModal(true)
  }

  // Filter products based on search and stock status
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    const status = getStockStatus(product).status
    const matchesStatus = stockStatusFilter === 'all' || status === stockStatusFilter
    return matchesSearch && matchesStatus
  })

  // Filter movements
  const filteredMovements = movements.filter(movement => {
    const matchesType = movementFilter === 'all' || movement.display_type === movementFilter
    const matchesItemType = itemTypeFilter === 'all' || movement.item_type === itemTypeFilter
    
    // Date filter logic
    let matchesDate = true
    if (dateFilter !== 'all') {
      const movementDate = new Date(movement.created_at)
      const today = new Date()
      
      switch (dateFilter) {
        case 'today':
          matchesDate = movementDate.toDateString() === today.toDateString()
          break
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = movementDate >= weekAgo
          break
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDate = movementDate >= monthAgo
          break
      }
    }
    
    return matchesType && matchesDate && matchesItemType
  })

  // Calculate stats
  const regularProducts = products.filter(p => !p.is_composite)
  const compositeProducts = products.filter(p => p.is_composite)
  const lowStockProducts = regularProducts.filter(p => {
    const status = getStockStatus(p)
    return status.status === 'low-stock'
  }).length
  const outOfStockProducts = regularProducts.filter(p => {
    const status = getStockStatus(p)
    return status.status === 'out-of-stock'
  }).length
  const totalValue = regularProducts.reduce((sum, p) => sum + (p.stock_quantity * p.default_price), 0)

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar userType="client" user={user} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 px-4">
            <div className="h-5 w-5 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-32 rounded bg-gray-200 animate-pulse ml-2" />
            <div className="ml-auto h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
          </header>
          <div className="flex flex-col gap-4 p-4 pt-0">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => <div key={i} className="rounded-2xl bg-gray-200 animate-pulse h-24" />)}
            </div>
            {[0, 1].map((j) => (
              <div key={j} className="rounded-xl border bg-white p-4 animate-pulse">
                <div className="flex justify-between items-center mb-4">
                  <div className="h-4 w-36 bg-gray-200 rounded" />
                  <div className="h-8 w-8 bg-gray-100 rounded" />
                </div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-gray-100 rounded" />
                      <div className="h-3 w-16 bg-gray-100 rounded" />
                      <div className="h-6 w-16 bg-gray-100 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar userType="client" user={user} />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 overflow-hidden">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/client">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/client/inventory">
                    Inventory
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Stock Tracking</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto px-4">
            <UserMenuDropdown />
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 pb-24">
          {/* Page Header */}
          <div className="hidden md:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                Inventory Tracking
              </h1>
              <p className="text-gray-600 mt-1">
                Monitor stock levels, movements, and alerts
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
              <p className="text-white/80 text-sm font-medium">Regular Products</p>
              <p className="text-3xl font-bold mt-1">{regularProducts.length}</p>
              <div className="flex items-center gap-1 mt-2 text-white/70 text-xs">
                <Package className="h-3.5 w-3.5" />
                <span>Tracked items</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-4 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
              <p className="text-white/80 text-sm font-medium">Composite</p>
              <p className="text-3xl font-bold mt-1">{compositeProducts.length}</p>
              <div className="flex items-center gap-1 mt-2 text-white/70 text-xs">
                <Layers className="h-3.5 w-3.5" />
                <span>Multi-ingredient</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-4 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
              <p className="text-white/80 text-sm font-medium">Low Stock Alert</p>
              <p className="text-3xl font-bold mt-1">{lowStockProducts}</p>
              <div className="flex items-center gap-1 mt-2 text-white/70 text-xs">
                <TrendingDown className="h-3.5 w-3.5" />
                <span>Need restocking</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-4 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
              <p className="text-white/80 text-sm font-medium">Out of Stock</p>
              <p className="text-3xl font-bold mt-1">{outOfStockProducts}</p>
              <div className="flex items-center gap-1 mt-2 text-white/70 text-xs">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Requires action</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
              <p className="text-white/80 text-sm font-medium">Inventory Value</p>
              <p className="text-3xl font-bold mt-1">₱{totalValue.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-2 text-white/70 text-xs">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Total stock value</span>
              </div>
            </div>
          </div>

          {/* Stock Levels Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Stock Levels</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search products..."
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
                      className={stockStatusFilter !== "all" ? "border-[#E8302A] text-[#E8302A]" : ""}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-56">
                    <p className="text-sm font-medium mb-3">Filters</p>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Stock Status</p>
                      <Select value={stockStatusFilter} onValueChange={setStockStatusFilter}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="in-stock">In Stock</SelectItem>
                          <SelectItem value="low-stock">Low Stock</SelectItem>
                          <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {stockStatusFilter !== "all" && (
                      <Button variant="ghost" size="sm" className="w-full text-gray-500 text-xs mt-2"
                        onClick={() => setStockStatusFilter("all")}>Clear filters</Button>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="hidden lg:table-cell">SKU</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="hidden lg:table-cell">Min Level</TableHead>
                    <TableHead className="hidden xl:table-cell">Max Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product)
                    const StatusIcon = stockStatus.icon
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="hidden lg:table-cell text-gray-500">{product.sku || 'N/A'}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {product.is_composite ? (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              <Layers className="w-3 h-3 mr-1" />
                              Composite
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              <Package className="w-3 h-3 mr-1" />
                              Regular
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {product.is_composite ? (
                            <span className="text-gray-400 text-sm">—</span>
                          ) : (
                            <span className="font-semibold">{product.stock_quantity}</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{product.is_composite ? '-' : (product.min_stock_level || 'N/A')}</TableCell>
                        <TableCell className="hidden xl:table-cell">{product.is_composite ? '-' : (product.max_stock_level || 'N/A')}</TableCell>
                        <TableCell>
                          <Badge className={stockStatus.color}>
                            <StatusIcon className="w-3 h-3 sm:mr-1" />
                            <span className="hidden sm:inline">{stockStatus.text}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleStockAdjustment(product)}
                            disabled={product.is_composite}
                            title="Adjust Stock"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Movements */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Recent Stock Movements</CardTitle>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className={(itemTypeFilter !== "all" || movementFilter !== "all" || dateFilter !== "today") ? "border-[#E8302A] text-[#E8302A]" : ""}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-64">
                    <p className="text-sm font-medium mb-3">Filters</p>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Item Type</p>
                        <Select value={itemTypeFilter} onValueChange={setItemTypeFilter}>
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Items</SelectItem>
                            <SelectItem value="product">Products Only</SelectItem>
                            <SelectItem value="ingredient">Ingredients Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Movement Type</p>
                        <Select value={movementFilter} onValueChange={setMovementFilter}>
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="in">Stock In</SelectItem>
                            <SelectItem value="out">Stock Out</SelectItem>
                            <SelectItem value="adjustment">Adjustment</SelectItem>
                            <SelectItem value="transfer">Transfer</SelectItem>
                            <SelectItem value="usage">Usage</SelectItem>
                            <SelectItem value="manufacturing">Manufacturing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Period</p>
                        <Select value={dateFilter} onValueChange={setDateFilter}>
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                            <SelectItem value="all">All Time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {(itemTypeFilter !== "all" || movementFilter !== "all" || dateFilter !== "today") && (
                        <Button variant="ghost" size="sm" className="w-full text-gray-500 text-xs"
                          onClick={() => { setItemTypeFilter("all"); setMovementFilter("all"); setDateFilter("today") }}>
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead>Movement</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead className="hidden lg:table-cell">Before</TableHead>
                    <TableHead className="hidden lg:table-cell">After</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="hidden xl:table-cell">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.length > 0 ? (
                    filteredMovements.slice(0, 20).map((movement) => {
                      const MovementIcon = getMovementIcon(movement.display_type)
                      const colorClass = getMovementColor(movement.display_type)
                      
                      return (
                        <TableRow key={movement.id}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{movement.item_name || 'Unknown'}</span>
                              <span className="text-xs text-gray-500">
                                {movement.item_type === 'ingredient' ? 'Ingredient' : 'Product'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {movement.item_type === 'ingredient' ? (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                Ingredient
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Product
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className={`flex items-center gap-2 ${colorClass}`}>
                              <MovementIcon className="w-4 h-4" />
                              <span className="capitalize">{getMovementTypeLabel(movement.display_type)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const isIncrease = movement.new_stock > movement.previous_stock
                              return (
                                <span className={`font-semibold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                                  {isIncrease ? '+' : '-'}{movement.quantity}
                                </span>
                              )
                            })()}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">{movement.previous_stock}</TableCell>
                          <TableCell className="hidden lg:table-cell">{movement.new_stock}</TableCell>
                          <TableCell className="hidden md:table-cell text-gray-500">
                            {new Date(movement.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell text-gray-500 max-w-xs truncate">
                            {movement.notes || 'No notes'}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No stock movements found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Modals */}
        {showAdjustmentModal && selectedProduct && (
          <StockAdjustmentModal
            product={selectedProduct}
            open={showAdjustmentModal}
            onOpenChange={setShowAdjustmentModal}
            onStockUpdated={fetchData}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}