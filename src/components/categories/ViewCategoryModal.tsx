'use client'

import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Folder, FolderOpen, Archive, Tag, Layers, Calendar, Package } from "lucide-react"

const CATEGORY_ICONS = [
  { value: 'folder', icon: Folder },
  { value: 'folder-open', icon: FolderOpen },
  { value: 'archive', icon: Archive },
  { value: 'tag', icon: Tag },
  { value: 'layers', icon: Layers },
]

export default function ViewCategoryModal({ category, open, onOpenChange }) {
  if (!category) return null

  const getIconComponent = (iconValue) => {
    const iconData = CATEGORY_ICONS.find(i => i.value === iconValue)
    return iconData ? iconData.icon : Folder
  }

  const IconComponent = getIconComponent(category.icon)

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Category Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Category Header */}
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-lg flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: category.color }}
            >
              <IconComponent className="h-8 w-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                {category.name}
              </h3>
              <Badge variant={category.is_active ? "default" : "secondary"}>
                {category.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          {/* Description */}
          {category.description && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Description</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                {category.description}
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {category.product_count || 0}
              </div>
              <div className="text-sm text-blue-800">Products</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {category.is_active ? 'Active' : 'Inactive'}
              </div>
              <div className="text-sm text-green-800">Status</div>
            </div>
          </div>

          {/* Category Properties */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Properties</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Color:</span>
                <div className="flex items-center gap-2 mt-1">
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-gray-900 font-mono text-xs">
                    {category.color}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-gray-500">Icon:</span>
                <div className="flex items-center gap-2 mt-1">
                  <IconComponent className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-900 capitalize">
                    {category.icon?.replace('-', ' ') || 'folder'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Products in Category */}
          {category.products && category.products.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Products ({category.products.length})
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {category.products.map((product, index) => (
                  <div 
                    key={product.id || product.sku || index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-gray-500">{product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(product.default_price)}
                      </p>
                    </div>
                  </div>
                ))}

              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium text-gray-900">Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>Created: {formatDate(category.created_at)}</span>
              </div>
              {category.updated_at && category.updated_at !== category.created_at && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>Updated: {formatDate(category.updated_at)}</span>
                </div>
              )}
              {category.store_id && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Package className="h-4 w-4" />
                  <span>Store ID: {category.store_id}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}