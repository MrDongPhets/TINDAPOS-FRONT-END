'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Folder, FolderOpen, Archive, Tag, Layers, Coffee, Wine, Utensils, Apple, Leaf, Fish, Package, Sparkles, Heart, Snowflake, Flame, Droplets, ShoppingBag, Baby, Shirt, Pill, Beef, IceCream } from "lucide-react"
import { toast } from "sonner"
import API_CONFIG from '@/config/api';

const CATEGORY_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
]

const CATEGORY_ICONS = [
  { value: 'coffee', icon: Coffee, label: 'Beverages' },
  { value: 'wine', icon: Wine, label: 'Alcoholic Drinks' },
  { value: 'utensils', icon: Utensils, label: 'Food' },
  { value: 'beef', icon: Beef, label: 'Meat' },
  { value: 'fish', icon: Fish, label: 'Seafood' },
  { value: 'apple', icon: Apple, label: 'Fruits' },
  { value: 'leaf', icon: Leaf, label: 'Vegetables' },
  { value: 'ice-cream', icon: IceCream, label: 'Ice Cream' },
  { value: 'snowflake', icon: Snowflake, label: 'Frozen' },
  { value: 'package', icon: Package, label: 'Canned/Packaged' },
  { value: 'flame', icon: Flame, label: 'Spicy/Hot' },
  { value: 'droplets', icon: Droplets, label: 'Liquids' },
  { value: 'sparkles', icon: Sparkles, label: 'Hygiene' },
  { value: 'heart', icon: Heart, label: 'Health' },
  { value: 'pill', icon: Pill, label: 'Medicine' },
  { value: 'baby', icon: Baby, label: 'Baby' },
  { value: 'shirt', icon: Shirt, label: 'Clothing' },
  { value: 'shopping-bag', icon: ShoppingBag, label: 'General' },
  { value: 'tag', icon: Tag, label: 'Tag' },
  { value: 'layers', icon: Layers, label: 'Mixed' },
  { value: 'archive', icon: Archive, label: 'Archive' },
  { value: 'folder', icon: Folder, label: 'Folder' },
]

export default function EditCategoryModal({ category, open, onOpenChange, onCategoryUpdated }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: 'folder',
    is_active: true
  })

  // Load category data when modal opens
  useEffect(() => {
    if (category && open) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        color: category.color || '#3B82F6',
        icon: category.icon || 'folder',
        is_active: category.is_active ?? true
      })
    }
  }, [category, open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Category name is required')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_CONFIG.BASE_URL}/client/categories/${category.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Category updated successfully!')
        onCategoryUpdated(data.category)
        onOpenChange(false)
      } else {
        toast.error(data.error || 'Failed to update category')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('Failed to update category')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getIconComponent = (iconValue) => {
    const iconData = CATEGORY_ICONS.find(i => i.value === iconValue)
    return iconData ? iconData.icon : Folder
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Beverages, Electronics"
              disabled={loading}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Optional category description"
              disabled={loading}
              rows={3}
            />
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label>Category Color</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    formData.color === color 
                      ? 'border-gray-900 scale-110' 
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleChange('color', color)}
                  disabled={loading}
                />
              ))}
            </div>
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <Label>Category Icon</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_ICONS.map((iconData) => {
                const IconComponent = iconData.icon
                return (
                  <button
                    key={iconData.value}
                    type="button"
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.icon === iconData.value
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                    onClick={() => handleChange('icon', iconData.value)}
                    disabled={loading}
                    title={iconData.label}
                  >
                    <IconComponent className="h-4 w-4" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1">
              <Label htmlFor="is_active">Category Status</Label>
              <p className="text-sm text-gray-500">
                {formData.is_active ? 'Active - visible to staff' : 'Inactive - hidden from staff'}
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleChange('is_active', checked)}
              disabled={loading}
            />
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: formData.color }}
              >
                {(() => {
                  const IconComponent = getIconComponent(formData.icon)
                  return <IconComponent className="h-5 w-5" />
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {formData.name || 'Category Name'}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {formData.description || 'No description'}
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Category
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}