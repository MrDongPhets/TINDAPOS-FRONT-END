// @ts-nocheck
// src/components/ui/image-preview.jsx - Better image preview with error handling
import logger from '@/utils/logger';

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X, ImageIcon } from "lucide-react"

export function ImagePreview({ src, alt = "Preview", onRemove, disabled = false, className = "" }) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const handleImageLoad = () => {
    setImageLoading(false)
    setImageError(false)
    logger.log('✅ Image loaded successfully:', src)
  }

  const handleImageError = (e) => {
    logger.error('❌ Image failed to load:', src)
    setImageLoading(false)
    setImageError(true)
  }

  // If no src or image error, don't render
  if (!src || imageError) {
    return (
      <div className="w-32 h-32 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-1" />
          <p className="text-xs text-gray-500">No image</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Loading placeholder */}
      {imageLoading && (
        <div className="w-32 h-32 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
            <p className="text-xs text-gray-500">Loading...</p>
          </div>
        </div>
      )}
      
      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        className={`w-32 h-32 object-cover rounded-lg border border-gray-200 shadow-sm ${
          imageLoading ? 'hidden' : 'block'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        crossOrigin="anonymous"
      />
      
      {/* Remove button */}
      {!imageLoading && !imageError && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
          onClick={onRemove}
          disabled={disabled}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}