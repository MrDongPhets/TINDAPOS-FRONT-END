'use client'

import { useState } from 'react'
import { Search, Barcode } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ProductSearch({ onSearch, searchQuery }) {
  const [inputValue, setInputValue] = useState(searchQuery || '')

  const handleChange = (e) => {
    const value = e.target.value
    setInputValue(value)
    onSearch(value)
  }

  const handleBarcodeClick = () => {
    // TODO: Implement barcode scanner
    // For web, you can use QuaggaJS or ZXing
    alert('Barcode scanner will be implemented')
  }

  return (
    <div className="mb-6">
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name, SKU, or barcode..."
            value={inputValue}
            onChange={handleChange}
            className="pl-10 h-12 text-lg"
            autoFocus
          />
        </div>
        <Button
          onClick={handleBarcodeClick}
          size="lg"
          variant="outline"
          className="px-6"
        >
          <Barcode className="h-5 w-5 mr-2" />
          Scan
        </Button>
      </div>
    </div>
  )
}