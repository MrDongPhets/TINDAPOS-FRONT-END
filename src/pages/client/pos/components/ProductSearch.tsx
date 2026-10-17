'use client'

import { useCallback, useState } from 'react'
import { Search, Barcode } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BarcodeScannerSheet } from '@/components/scanner/BarcodeScannerSheet'

const hasCamera = () => typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

export default function ProductSearch({ onSearch, onBarcodeScanned = null, searchQuery }) {
  const [inputValue, setInputValue] = useState(searchQuery || '')
  const [scannerOpen, setScannerOpen] = useState(false)

  const handleChange = (e) => {
    const value = e.target.value
    setInputValue(value)
    onSearch(value)
  }

  const handleCode = useCallback((barcode: string) => {
    if (onBarcodeScanned) {
      onBarcodeScanned(barcode)
    } else {
      setInputValue(barcode)
      onSearch(barcode)
    }
  }, [onBarcodeScanned, onSearch])

  const closeScanner = useCallback(() => setScannerOpen(false), [])

  const handleBarcodeClick = () => {
    if (hasCamera()) {
      setScannerOpen(true)
      return
    }
    // No camera API (very old browser) — manual entry fallback
    const value = prompt('Enter barcode manually:')?.trim()
    if (value) handleCode(value)
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
        <Button onClick={handleBarcodeClick} size="lg" variant="outline" className="px-6">
          <Barcode className="h-5 w-5 mr-2" />
          Scan
        </Button>
      </div>

      {/* Stays open so the cashier can scan item after item; each scan adds to the cart */}
      <BarcodeScannerSheet
        open={scannerOpen}
        onClose={closeScanner}
        onScan={handleCode}
        continuous={!!onBarcodeScanned}
        title="Scan product"
      />
    </div>
  )
}
