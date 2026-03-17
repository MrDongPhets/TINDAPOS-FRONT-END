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
  Folder,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  RefreshCw,
  FolderOpen,
  Package,
  Filter
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import AddCategoryModal from '@/components/categories/AddCategoryModal'
import EditCategoryModal from '@/components/categories/EditCategoryModal'
import ViewCategoryModal from '@/components/categories/ViewCategoryModal'
import DeleteCategoryDialog from '@/components/categories/DeleteCategoryDialog'
import API_CONFIG from '@/config/api';
import { UserMenuDropdown } from "@/components/ui/UserMenuDropdown"

export default function CategoriesPage() {
  const [user, setUser] = useState(null)
  const [categories, setCategories] = useState([])
  const [totalCategories, setTotalCategories] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('userData')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_CONFIG.BASE_URL}/client/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
        setTotalCategories(data.count || data.categories?.length || 0)
      } else {
        console.error('Failed to fetch categories')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  // Event handlers
  const handleCategoryAdded = (newCategory) => {
    setCategories(prev => [newCategory, ...prev])
    setTotalCategories(prev => prev + 1)
  }

  const handleCategoryUpdated = (updatedCategory) => {
    setCategories(prev => prev.map(category => 
      category.id === updatedCategory.id ? updatedCategory : category
    ))
  }

  const handleCategoryDeleted = (deletedCategoryId) => {
    setCategories(prev => prev.filter(category => category.id !== deletedCategoryId))
    setTotalCategories(prev => prev - 1)
  }

  // Action handlers
  const handleViewCategory = (category) => {
    setSelectedCategory(category)
    setShowViewModal(true)
  }

  const handleEditCategory = (category) => {
    setSelectedCategory(category)
    setShowEditModal(true)
  }

  const handleDeleteCategory = (category) => {
    setSelectedCategory(category)
    setShowDeleteDialog(true)
  }

  // Filter categories based on search and active/inactive toggle
  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = showInactive ? true : category.is_active
    
    return matchesSearch && matchesStatus
  })

  const getIconComponent = (iconName) => {
    const iconMap = {
      folder: Folder,
      'folder-open': FolderOpen,
      // Add more icon mappings as needed
    }
    const IconComponent = iconMap[iconName] || Folder
    return <IconComponent className="h-4 w-4" />
  }

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
                  <BreadcrumbPage>Categories</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto px-4 flex items-center gap-2 shrink-0">
            <div className="relative hidden sm:block w-48">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="search"
                placeholder="Search categories..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              variant={showInactive ? "default" : "outline"}
              size="sm"
              onClick={() => setShowInactive(!showInactive)}
            >
              <Filter className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{showInactive ? "Hide Inactive" : "Show All"}</span>
            </Button>
            <UserMenuDropdown />
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 pb-24">
          {/* Page Header */}
          <div className="hidden md:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <Folder className="h-6 w-6 text-blue-600" />
                Categories Management
              </h1>
              <p className="text-gray-600 mt-1">
                Organize your products into categories • {totalCategories} total categories
                {!showInactive && ` • Showing only active categories`}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
              <p className="text-white/80 text-sm font-medium">Total Categories</p>
              <p className="text-3xl font-bold mt-1">{totalCategories}</p>
              <div className="flex items-center gap-1 mt-2 text-white/70 text-xs">
                <Folder className="h-3.5 w-3.5" />
                <span>All categories</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
              <p className="text-white/80 text-sm font-medium">Active</p>
              <p className="text-3xl font-bold mt-1">{categories.filter(c => c.is_active).length}</p>
              <div className="flex items-center gap-1 mt-2 text-white/70 text-xs">
                <FolderOpen className="h-3.5 w-3.5" />
                <span>In use</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-slate-500 to-gray-600 rounded-2xl p-4 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
              <p className="text-white/80 text-sm font-medium">Inactive</p>
              <p className="text-3xl font-bold mt-1">{categories.filter(c => !c.is_active).length}</p>
              <div className="flex items-center gap-1 mt-2 text-white/70 text-xs">
                <Folder className="h-3.5 w-3.5" />
                <span>Disabled</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-4 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
              <p className="text-white/80 text-sm font-medium">Total Products</p>
              <p className="text-3xl font-bold mt-1">{categories.reduce((sum, c) => sum + (c.product_count || 0), 0)}</p>
              <div className="flex items-center gap-1 mt-2 text-white/70 text-xs">
                <Package className="h-3.5 w-3.5" />
                <span>Categorized</span>
              </div>
            </div>
          </div>

          {/* Categories Grid */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap justify-between items-center gap-2">
                <CardTitle>Categories</CardTitle>
                <AddCategoryModal onCategoryAdded={handleCategoryAdded} />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-12">
                  <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'No categories found' : 'No categories yet'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm 
                      ? `No categories match "${searchTerm}"`
                      : 'Get started by creating your first category'
                    }
                  </p>
                  {!searchTerm && (
                    <AddCategoryModal onCategoryAdded={handleCategoryAdded} />
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
                  {filteredCategories.map((category) => (
                    <Card 
                      key={category.id} 
                      className={`hover:shadow-md transition-shadow cursor-pointer ${
                        !category.is_active ? 'opacity-75 border-dashed' : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                              style={{ backgroundColor: category.color || '#3B82F6' }}
                            >
                              {getIconComponent(category.icon)}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 text-sm truncate">
                                {category.name}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">
                                {category.product_count || 0} products
                              </p>
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewCategory(category)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteCategory(category)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {category.description && (
                          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                            {category.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <Badge 
                            variant={category.is_active ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {category.is_active ? "Active" : "Inactive"}
                          </Badge>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-2"
                            onClick={() => handleViewCategory(category)}
                          >
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modals */}
        {showViewModal && selectedCategory && (
          <ViewCategoryModal
            category={selectedCategory}
            open={showViewModal}
            onOpenChange={setShowViewModal}
          />
        )}

        {showEditModal && selectedCategory && (
          <EditCategoryModal
            category={selectedCategory}
            open={showEditModal}
            onOpenChange={setShowEditModal}
            onCategoryUpdated={handleCategoryUpdated}
          />
        )}

        {showDeleteDialog && selectedCategory && (
          <DeleteCategoryDialog
            category={selectedCategory}
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            onCategoryDeleted={handleCategoryDeleted}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}