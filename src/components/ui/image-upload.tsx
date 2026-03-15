// @ts-nocheck
// src/components/ui/image-upload.jsx - Reusable image upload component
import logger from '@/utils/logger';

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Loader2, 
  AlertCircle,
  Camera,
  Link
} from "lucide-react"
import API_CONFIG from "@/config/api"

export function ImageUpload({ 
  value = "", 
  onChange, 
  disabled = false,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB default
  className = ""
}) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken')
    return {
      'Authorization': `Bearer ${token}`
    }
  }

  const validateFile = (file) => {
    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024))
      throw new Error(`File size must be less than ${maxSizeMB}MB`)
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file')
    }

    // Check specific formats
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Please select a JPEG, PNG, GIF, or WebP image')
    }

    return true
  }

  const uploadFile = async (file) => {
    try {
      validateFile(file)
      setError("")
      setUploading(true)
      setProgress(0)

      const formData = new FormData()
      formData.append('file', file)

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) return prev + 10
          return prev
        })
      }, 200)

      const response = await fetch(`${API_CONFIG.BASE_URL}/client/upload/image`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      })

      clearInterval(progressInterval)

      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json()
        if (errorData.code === 'TOKEN_EXPIRED' || errorData.code === 'INVALID_TOKEN') {
          throw new Error('Your session has expired. Please log in again.')
        }
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      setProgress(100)

      logger.log('✅ Upload response data:', data);
      logger.log('✅ Image URL from server:', data.url);

      // Call onChange with the uploaded image URL
      // For local uploads (SQLite mode), prefix with backend base URL
      if (onChange && data.url) {
        const fullUrl = data.url.startsWith('/uploads/')
          ? `${API_CONFIG.BASE_URL}${data.url}`
          : data.url
        logger.log('✅ Setting image URL:', fullUrl);
        onChange(fullUrl)
      }

      logger.log('✅ Image uploaded successfully:', data.url)

    } catch (error) {
      logger.error('Upload failed:', error)
      setError(error.message)
      setProgress(0)
    } finally {
      setUploading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragOver(false)
    
    const files = event.dataTransfer.files
    if (files.length > 0) {
      uploadFile(files[0])
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    setDragOver(false)
  }

  const removeImage = () => {
    if (onChange) {
      onChange("")
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Current Image Preview */}
      {value && !uploading && (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Product preview"
            className="w-32 h-32 object-cover rounded-lg border border-gray-200 shadow-sm"
            onError={(e) => {
              logger.error('Image failed to load:', value);
              // Replace with a placeholder when image fails to load
              e.target.src = '/api/placeholder/128/128';
              // If that fails too, hide the image and show upload area
              e.target.onerror = () => {
                e.target.style.display = 'none';
                if (onChange) onChange(''); // Clear the invalid URL
              };
            }}
            onLoad={(e) => {
              logger.log('Image loaded successfully:', value);
              e.target.style.display = 'block';
            }}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={removeImage}
            disabled={disabled}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Upload Area */}
      {!value && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer
            ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={!disabled ? openFileDialog : undefined}
        >
          <div className="text-center">
            {uploading ? (
              <>
                <Loader2 className="mx-auto h-12 w-12 text-blue-500 animate-spin mb-4" />
                <p className="text-sm font-medium text-gray-900 mb-2">Uploading image...</p>
                <Progress value={progress} className="w-full max-w-xs mx-auto" />
                <p className="text-xs text-gray-500 mt-2">{progress}%</p>
              </>
            ) : (
              <>
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Drop an image here, or click to select
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPEG, GIF, WebP up to {Math.round(maxSize / (1024 * 1024))}MB
                </p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
          />
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-xs text-center text-gray-500">
            Uploading... {progress}%
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Alternative: Image URL Input */}
      {!uploading && (
        <div className="pt-2 border-t">
          <Label className="text-sm font-medium text-gray-600">Or paste image URL</Label>
          <div className="flex gap-2 mt-1">
            <Input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={value}
              onChange={(e) => onChange && onChange(e.target.value)}
              disabled={disabled}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={disabled}
              onClick={() => {
                // Clear the URL input
                if (onChange) onChange("")
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}