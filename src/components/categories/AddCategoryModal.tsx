// src/components/categories/AddCategoryModal.jsx
'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Loader2, Folder, FolderOpen, Archive, Tag, Layers } from "lucide-react"
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
  { value: 'folder', icon: Folder, label: 'Folder' },
  { value: 'folder-open', icon: FolderOpen, label: 'Open Folder' },
  { value: 'archive', icon: Archive, label: 'Archive' },
  { value: 'tag', icon: Tag, label: 'Tag' },
  { value: 'layers', icon: Layers, label: 'Layers' },
]

export default function AddCategoryModal({ onCategoryAdded }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: 'folder'
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Category name is required')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_CONFIG.BASE_URL}/client/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Category created successfully!')
        onCategoryAdded(data.category)
        setOpen(false)
        setFormData({
          name: '',
          description: '',
          color: '#3B82F6',
          icon: 'folder'
        })
      } else {
        toast.error(data.error || 'Failed to create category')
      }
    } catch (error) {
      console.error('Error creating category:', error)
      toast.error('Failed to create category')
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
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
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Category
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}