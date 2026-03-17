// src/app/client/inventory/ingredients-tracking/page.jsx

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
  BarChart3,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Beaker,
  AlertTriangle,
  Minus,
  RotateCcw
} from "lucide-react"
import { StockAdjustmentModal } from '@/components/inventory/IngredientActionsModals'
import API_CONFIG from '@/config/api';

export default function IngredientsTrackingPage() {
  const [user, setUser] = useState(null)
  const [ingredients, setIngredients] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIngredient, setSelectedIngredient] = useState(null)
  const [movementFilter, setMovementFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('today')
  
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
        fetchIngredients(),
        fetchMovements()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchIngredients = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_CONFIG.BASE_URL}/client/ingredients`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setIngredients(data.ingredients || [])
      }
    } catch (error) {
      console.error('Error fetching ingredients:', error)
    }
  }

  const fetchMovements = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_CONFIG.BASE_URL}/client/ingredients/movements`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMovements(data.movements || [])
      }
    } catch (error) {
      console.error('Error fetching movements:', error)
    }
  }

  const getStockStatus = (ingredient) => {
    if (ingredient.stock_quantity <= 0) {
      return { 
        status: 'out-of-stock', 
        color: 'bg-red-100 text-red-800', 
        text: 'Out of Stock',
        icon: AlertTriangle 
      }
    } else if (ingredient.stock_quantity <= ingredient.min_stock_level) {
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
      'usage': Minus
    }
    return iconMap[type] || Beaker
  }

  const getMovementColor = (type) => {
    const colorMap = {
      'in': 'text-green-600',
      'out': 'text-red-600',
      'adjustment': 'text-blue-600',
      'usage': 'text-orange-600'
    }
    return colorMap[type] || 'text-gray-600'
  }

  const getMovementTypeLabel = (type) => {
    const labelMap = {
      'in': 'Stock In',
      'out': 'Stock Out',
      'adjustment': 'Adjustment',
      'usage': 'Used in Manufacturing'
    }
    return labelMap[type] || type
  }

  const handleStockAdjustment = (ingredient) => {
    setSelectedIngredient(ingredient)
    setShowAdjustmentModal(true)
  }

  // Filter ingredients based on search
  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ingredient.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Filter movements
  const filteredMovements = movements.filter(movement => {
    const matchesType = movementFilter === 'all' || movement.movement_type === movementFilter
    
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
    
    return matchesType && matchesDate
  })

  // Calculate stats
  const lowStockIngredients = ingredients.filter(i => getStockStatus(i).status === 'low-stock').length
  const outOfStockIngredients = ingredients.filter(i => getStockStatus(i).status === 'out-of-stock').length
  const totalValue = ingredients.reduce((sum, i) => sum + (i.stock_quantity * i.unit_cost), 0)

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar userType="client" user={user} />
        <SidebarInset>
          <div className="flex items-center justify-center min-h-screen">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
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
                  <BreadcrumbPage>Ingredients Tracking</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto px-4 flex items-center gap-2 min-w-0 overflow-hidden">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="search"
                placeholder="Search ingredients..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 pb-24">
          {/* Page Header */}
          <div className="hidden md:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <Beaker className="h-6 w-6 text-amber-600" />
                Ingredients Stock Tracking
              </h1>
              <p className="text-gray-600 mt-1">
                Monitor ingredient stock levels, usage, and alerts
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
              <p className="text-white/80 text-sm font-medium">Total Ingredients</p>
              <p className="text-3xl font-bold mt-1">{ingredients.length}</p>
              <div className="flex items-center gap-1 mt-2 text-white/70 text-xs">
                <Beaker className="h-3.5 w-3.5" />
                <span>All tracked items</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-4 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
              <p className="text-white/80 text-sm font-medium">Low Stock Alert</p>
              <p className="text-3xl font-bold mt-1">{lowStockIngredients}</p>
              <div className="flex items-center gap-1 mt-2 text-white/70 text-xs">
                <TrendingDown className="h-3.5 w-3.5" />
                <span>Need restocking</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-4 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
              <p className="text-white/80 text-sm font-medium">Out of Stock</p>
              <p className="text-3xl font-bold mt-1">{outOfStockIngredients}</p>
              <div className="flex items-center gap-1 mt-2 text-white/70 text-xs">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Requires action</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
              <p className="text-white/80 text-sm font-medium">Ingredients Value</p>
              <p className="text-3xl font-bold mt-1">₱{totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
              <div className="flex items-center gap-1 mt-2 text-white/70 text-xs">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Total stock value</span>
              </div>
            </div>
          </div>

          {/* Stock Levels Table */}
          <Card>
            <CardHeader>
              <CardTitle>Ingredient Stock Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead className="hidden xl:table-cell">SKU</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="hidden lg:table-cell">Unit</TableHead>
                    <TableHead className="hidden lg:table-cell">Min Level</TableHead>
                    <TableHead className="hidden xl:table-cell">Unit Cost</TableHead>
                    <TableHead className="hidden md:table-cell">Total Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIngredients.length > 0 ? (
                    filteredIngredients.map((ingredient) => {
                      const stockStatus = getStockStatus(ingredient)
                      const StatusIcon = stockStatus.icon
                      const totalValue = (ingredient.stock_quantity * ingredient.unit_cost).toFixed(2)
                      
                      return (
                        <TableRow key={ingredient.id}>
                          <TableCell className="font-medium">{ingredient.name}</TableCell>
                          <TableCell className="hidden xl:table-cell text-gray-500">{ingredient.sku || 'N/A'}</TableCell>
                          <TableCell>
                            <span className="font-semibold">{ingredient.stock_quantity}</span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-gray-500">{ingredient.unit}</TableCell>
                          <TableCell className="hidden lg:table-cell">{ingredient.min_stock_level || 'N/A'}</TableCell>
                          <TableCell className="hidden xl:table-cell">₱{ingredient.unit_cost.toFixed(4)}</TableCell>
                          <TableCell className="hidden md:table-cell font-medium">₱{totalValue}</TableCell>
                          <TableCell>
                            <Badge className={stockStatus.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {stockStatus.text}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStockAdjustment(ingredient)}
                            >
                              Adjust
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        No ingredients found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Movements */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Ingredient Movements</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={movementFilter} onValueChange={setMovementFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Movement Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="in">Stock In</SelectItem>
                    <SelectItem value="out">Stock Out</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                    <SelectItem value="usage">Usage</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead className="hidden lg:table-cell">Unit</TableHead>
                    <TableHead className="hidden lg:table-cell">Before</TableHead>
                    <TableHead className="hidden lg:table-cell">After</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="hidden xl:table-cell">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.length > 0 ? (
                    filteredMovements.slice(0, 20).map((movement) => {
                      const MovementIcon = getMovementIcon(movement.movement_type)
                      const colorClass = getMovementColor(movement.movement_type)
                      
                      return (
                        <TableRow key={movement.id}>
                          <TableCell className="font-medium">
                            {movement.ingredient_name || 'Unknown Ingredient'}
                          </TableCell>
                          <TableCell>
                            <div className={`flex items-center gap-2 ${colorClass}`}>
                              <MovementIcon className="w-4 h-4" />
                              <span className="capitalize">{getMovementTypeLabel(movement.movement_type)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`font-semibold ${
                              movement.movement_type === 'in' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {movement.movement_type === 'in' ? '+' : '-'}{movement.quantity}
                            </span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-gray-500">{movement.ingredient_unit || movement.unit}</TableCell>
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
                        No ingredient movements found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Modals */}
        {showAdjustmentModal && selectedIngredient && (
          <StockAdjustmentModal
            ingredient={selectedIngredient}
            open={showAdjustmentModal}
            onOpenChange={setShowAdjustmentModal}
            onStockUpdated={fetchData}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}