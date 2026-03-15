'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, AlertTriangle, Package, Info } from "lucide-react"
import { toast } from "sonner"
import API_CONFIG from '@/config/api';

export default function DeleteCategoryDialog({ category, open, onOpenChange, onCategoryDeleted }) {
  const [loading, setLoading] = useState(false)

  if (!category) return null

  const handleDelete = async () => {
    setLoading(true)

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_CONFIG.BASE_URL}/client/categories/${category.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Category deleted successfully!')
        onCategoryDeleted(category.id)
        onOpenChange(false)
      } else {
        // Handle specific error for categories with products
        if (data.code === 'CATEGORY_HAS_PRODUCTS') {
          toast.error(
            `Cannot delete category with ${data.product_count} products. Please move or delete the products first.`
          )
        } else {
          toast.error(data.error || 'Failed to delete category')
        }
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category')
    } finally {
      setLoading(false)
    }
  }

  const hasProducts = category.product_count > 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the category "{category.name}"?
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        
        {/* Category Info */}
        <div className="my-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: category.color }}
            >
              <Package className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{category.name}</h4>
              <p className="text-sm text-gray-500">
                {category.product_count || 0} products • {category.is_active ? 'Active' : 'Inactive'}
              </p>
              {category.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {category.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Warning Messages */}
        <div className="space-y-3">
          {hasProducts ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-1">Cannot Delete Category</p>
                  <p>
                    This category contains {category.product_count} product{category.product_count !== 1 ? 's' : ''}.
                    You must move or delete all products before deleting this category.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Before deleting:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>This action cannot be undone</li>
                    <li>Category will be permanently removed</li>
                    <li>All references to this category will be cleared</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || hasProducts}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Category
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}