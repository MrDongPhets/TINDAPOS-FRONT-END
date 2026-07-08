'use client'

import { useState } from 'react'
import { Search, Barcode } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Capacitor } from '@capacitor/core'

async function scanBarcode(): Promise<string | null> {
  // Native Android/iOS — use MLKit
  if (Capacitor.isNativePlatform()) {
    const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning')

    const { camera } = await BarcodeScanner.requestPermissions()
    if (camera !== 'granted' && camera !== 'limited') {
      alert('Camera permission is required to scan barcodes.')
      return null
    }

    const { barcodes } = await BarcodeScanner.scan()
    return barcodes?.[0]?.rawValue ?? null
  }

  // Web browser — use BarcodeDetector API (Chrome/Edge) or fallback
  if ('BarcodeDetector' in window) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      // @ts-ignore
      const detector = new (window as any).BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'qr_code', 'upc_a', 'upc_e'] })

      return new Promise((resolve) => {
        const video = document.createElement('video')
        video.srcObject = stream
        video.play()

        // Overlay
        const overlay = document.createElement('div')
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;'
        video.style.cssText = 'width:100%;max-width:480px;border-radius:8px;'
        const hint = document.createElement('p')
        hint.textContent = 'Point camera at barcode — tap anywhere to cancel'
        hint.style.cssText = 'color:white;font-size:14px;text-align:center;padding:0 24px;'
        overlay.appendChild(video)
        overlay.appendChild(hint)
        document.body.appendChild(overlay)

        let found = false
        const interval = setInterval(async () => {
          try {
            const barcodes = await detector.detect(video)
            if (barcodes.length > 0 && !found) {
              found = true
              clearInterval(interval)
              stream.getTracks().forEach(t => t.stop())
              document.body.removeChild(overlay)
              resolve(barcodes[0].rawValue)
            }
          } catch { /* frame not ready yet */ }
        }, 200)

        overlay.addEventListener('click', () => {
          if (!found) {
            clearInterval(interval)
            stream.getTracks().forEach(t => t.stop())
            document.body.removeChild(overlay)
            resolve(null)
          }
        })
      })
    } catch {
      alert('Could not access camera.')
      return null
    }
  }

  // No camera API available — manual entry fallback
  const value = prompt('Enter barcode manually:')
  return value?.trim() || null
}

export default function ProductSearch({ onSearch, searchQuery }) {
  const [inputValue, setInputValue] = useState(searchQuery || '')
  const [scanning, setScanning] = useState(false)

  const handleChange = (e) => {
    const value = e.target.value
    setInputValue(value)
    onSearch(value)
  }

  const handleBarcodeClick = async () => {
    setScanning(true)
    try {
      const barcode = await scanBarcode()
      if (barcode) {
        setInputValue(barcode)
        onSearch(barcode)
      }
    } finally {
      setScanning(false)
    }
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
          disabled={scanning}
          size="lg"
          variant="outline"
          className="px-6"
        >
          <Barcode className={`h-5 w-5 mr-2 ${scanning ? 'animate-pulse' : ''}`} />
          {scanning ? 'Scanning...' : 'Scan'}
        </Button>
      </div>
    </div>
  )
}
