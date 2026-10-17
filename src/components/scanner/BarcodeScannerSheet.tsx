// In-app barcode scanner — a bottom sheet with a live camera preview, scan box, flash and camera switch.
// Replaces the full-screen native scanner (whose back button also navigated the app away).
//
// Detection: native BarcodeDetector when the browser/WebView has it (fast), otherwise ZXing (pure JS, works offline).
// continuous=true keeps the camera open for scanning many items (POS); false closes after the first code (forms).
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Capacitor } from '@capacitor/core'
import type { IScannerControls } from '@zxing/browser'
import { Button } from '@/components/ui/button'
import { Camera, CheckCircle2, ScanLine, X, Zap, ZapOff } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  onScan: (code: string) => void
  continuous?: boolean
  title?: string
}

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf', 'qr_code']
const SAME_CODE_COOLDOWN_MS = 1500

type Detector = { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> }

async function createNativeDetector(): Promise<Detector | null> {
  const Native = (window as unknown as { BarcodeDetector?: { new (o: { formats: string[] }): Detector; getSupportedFormats(): Promise<string[]> } }).BarcodeDetector
  if (!Native) return null
  try {
    const supported = await Native.getSupportedFormats()
    const formats = FORMATS.filter(f => supported.includes(f))
    return formats.includes('ean_13') ? new Native({ formats }) : null
  } catch {
    return null
  }
}

// Short beep + vibration so the cashier knows the scan worked without looking
function feedback() {
  try {
    navigator.vibrate?.(60)
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 1200
    gain.gain.value = 0.08
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.08)
    osc.onended = () => ctx.close()
  } catch { /* audio not allowed — vibration is enough */ }
}

export function BarcodeScannerSheet({ open, onClose, onScan, continuous = false, title = 'Scan product' }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onScanRef = useRef(onScan)
  const onCloseRef = useRef(onClose)
  const lastScanRef = useRef<{ code: string; at: number }>({ code: '', at: 0 })

  const [facing, setFacing] = useState<'environment' | 'user'>('environment')
  const [torchOn, setTorchOn] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)
  const [error, setError] = useState('')
  const [lastCode, setLastCode] = useState('')
  const [track, setTrack] = useState<MediaStreamTrack | null>(null)

  // Keep latest callbacks without restarting the camera when the parent re-renders
  useEffect(() => {
    onScanRef.current = onScan
    onCloseRef.current = onClose
  }, [onScan, onClose])

  const handleCode = useCallback((code: string) => {
    const now = Date.now()
    if (code === lastScanRef.current.code && now - lastScanRef.current.at < SAME_CODE_COOLDOWN_MS) return
    lastScanRef.current = { code, at: now }
    feedback()
    setLastCode(code)
    onScanRef.current(code)
    if (!continuous) onCloseRef.current()
  }, [continuous])

  // Android back button / browser back closes the sheet instead of leaving the page
  useEffect(() => {
    if (!open) return
    window.history.pushState({ scanner: true }, '')
    const onPop = () => onCloseRef.current()
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      if (window.history.state?.scanner) window.history.back()
    }
  }, [open])

  // Start / restart the camera when opened or the camera is switched
  useEffect(() => {
    if (!open) return
    let cancelled = false
    let stream: MediaStream | null = null
    let zxingControls: IScannerControls | null = null
    let loopTimer: ReturnType<typeof setTimeout> | null = null

    const start = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          // Make sure Android has granted the camera permission before getUserMedia
          const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning')
          const { camera } = await BarcodeScanner.requestPermissions()
          if (camera !== 'granted' && camera !== 'limited') throw new Error('permission')
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }

        const videoTrack = stream.getVideoTracks()[0]
        const caps = (videoTrack.getCapabilities?.() || {}) as { torch?: boolean }
        setTrack(videoTrack)
        setTorchSupported(!!caps.torch)
        setTorchOn(false)

        const video = videoRef.current!
        video.srcObject = stream
        await video.play().catch(() => {})

        const native = await createNativeDetector()
        if (cancelled) return

        if (native) {
          const loop = async () => {
            if (cancelled) return
            try {
              const codes = await native.detect(video)
              if (codes[0]?.rawValue) handleCode(codes[0].rawValue)
            } catch { /* frame not ready */ }
            loopTimer = setTimeout(loop, 150)
          }
          loop()
        } else {
          // Loaded on demand — keeps ZXing out of the main bundle (PWA precache limit is 2 MB per file)
          const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
            import('@zxing/browser'),
            import('@zxing/library'),
          ])
          if (cancelled) return
          const formats = [
            BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
            BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.ITF, BarcodeFormat.QR_CODE,
          ]
          const hints = new Map<number, unknown>([[DecodeHintType.POSSIBLE_FORMATS, formats], [DecodeHintType.TRY_HARDER, true]])
          const reader = new BrowserMultiFormatReader(hints as never, { delayBetweenScanAttempts: 150 })
          zxingControls = await reader.decodeFromStream(stream, video, result => {
            if (result) handleCode(result.getText())
          })
        }
      } catch (err) {
        if (cancelled) return
        setError(
          (err as Error)?.message === 'permission' || (err as DOMException)?.name === 'NotAllowedError'
            ? 'Camera permission is needed. Allow camera access in your phone settings, then try again.'
            : 'Could not open the camera. Close other apps using the camera and try again.'
        )
      }
    }

    start()

    return () => {
      cancelled = true
      if (loopTimer) clearTimeout(loopTimer)
      zxingControls?.stop()
      stream?.getTracks().forEach(t => t.stop())
      setTrack(null)
    }
  }, [open, facing, handleCode])

  const toggleTorch = async () => {
    if (!track) return
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as MediaTrackConstraintSet] })
      setTorchOn(t => !t)
    } catch {
      setTorchSupported(false)
    }
  }

  if (!open) return null

  // Portal to <body> so it sits above any open dialog (e.g. Add Product). pointer-events-auto because
  // Radix modals set pointer-events:none on <body>; data-barcode-scanner lets dialogs ignore taps on it.
  return createPortal(
    <div
      data-barcode-scanner
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] shadow-xl">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-200 sm:hidden" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="h-11 w-11 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
            <ScanLine className="h-5 w-5 text-[#E8302A]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">Barcode scanner</p>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">{title}</h2>
          </div>
          <button onClick={onClose} className="h-10 w-10 rounded-xl border flex items-center justify-center text-gray-500 hover:bg-gray-50" aria-label="Close scanner">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Camera */}
        <div className="relative w-full aspect-[3/4] max-h-[55vh] rounded-2xl overflow-hidden bg-black">
          <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" muted playsInline />

          {!error && (
            <>
              {/* Scan box */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[78%] h-[34%] rounded-2xl border-[3px] border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
                <div className="absolute left-3 right-3 h-0.5 bg-[#E8302A] shadow-[0_0_8px_#E8302A] animate-[scanline_1.8s_ease-in-out_infinite]" />
              </div>
              {torchSupported && (
                <button
                  onClick={toggleTorch}
                  className={`absolute top-3 right-3 h-10 w-10 rounded-full flex items-center justify-center ${torchOn ? 'bg-yellow-400 text-black' : 'bg-black/50 text-white'}`}
                  aria-label={torchOn ? 'Turn flash off' : 'Turn flash on'}
                >
                  {torchOn ? <ZapOff className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                </button>
              )}
            </>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white bg-black/80">{error}</div>
          )}
        </div>

        {/* Status */}
        <div className="min-h-[2.5rem] flex items-center justify-center text-sm mt-2">
          {lastCode && continuous ? (
            <span className="flex items-center gap-1.5 text-green-700 font-medium">
              <CheckCircle2 className="h-4 w-4" /> Scanned {lastCode} — scan the next item
            </span>
          ) : (
            <span className="text-gray-500">Point the barcode inside the scanning box.</span>
          )}
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-12" onClick={() => { setError(''); setFacing(f => (f === 'environment' ? 'user' : 'environment')) }}>
            <Camera className="h-4 w-4 mr-2" />
            {facing === 'environment' ? 'Use front camera' : 'Use back camera'}
          </Button>
          <Button variant="outline" className="h-12" onClick={toggleTorch} disabled={!torchSupported}>
            {torchOn ? <ZapOff className="h-4 w-4 mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
            {torchOn ? 'Turn flash off' : 'Turn flash on'}
          </Button>
        </div>
        <Button className="w-full h-12 mt-2 bg-gray-100 text-gray-800 hover:bg-gray-200" onClick={onClose}>
          {continuous && lastCode ? 'Done' : 'Cancel'}
        </Button>
      </div>
    </div>,
    document.body
  )
}
