import { useState, useEffect } from 'react'
import { X, Download, Smartphone, Zap, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

const DISMISS_KEY = 'pwa_install_dismissed_at'
const DISMISS_DAYS = 3 // re-show after 3 days if dismissed

function isDismissedRecently(): boolean {
  const ts = localStorage.getItem(DISMISS_KEY)
  if (!ts) return false
  const daysSince = (Date.now() - Number(ts)) / (1000 * 60 * 60 * 24)
  return daysSince < DISMISS_DAYS
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  )
}

export function PWAInstallModal() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [show, setShow] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    // Already installed as PWA — never show
    if (isStandalone()) return
    // Already dismissed recently — skip
    if (isDismissedRecently()) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Small delay so page loads first before modal appears
      setTimeout(() => setShow(true), 2500)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Also handle the case where the app was previously installed
    // When uninstalled, display-mode goes back to browser and
    // beforeinstallprompt fires again on next visit
    window.addEventListener('appinstalled', () => {
      setShow(false)
      setDeferredPrompt(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    setInstalling(true)
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setInstalling(false)
    if (outcome === 'accepted') {
      setShow(false)
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setShow(false)
  }

  if (!show) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] animate-in fade-in duration-200"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] px-4 pb-6 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-sm sm:w-full animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Brand header strip */}
          <div className="bg-gradient-to-r from-[#E8302A] to-[#f97316] px-5 pt-5 pb-8 relative">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                <img src="/logo.png" alt="TindaPOS" className="w-9 h-9 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <span className="text-[#E8302A] font-black text-lg hidden">T</span>
              </div>
              <div>
                <p className="text-white font-bold text-lg leading-tight">TindaPOS</p>
                <p className="text-white/80 text-xs">Install for the best experience</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-5 pt-4 pb-5 -mt-4">
            {/* White card that overlaps header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-[#E8302A]" />
                  </div>
                  <p className="text-xs text-gray-600 leading-tight">Faster<br />access</p>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center">
                    <WifiOff className="w-4 h-4 text-[#f97316]" />
                  </div>
                  <p className="text-xs text-gray-600 leading-tight">Works<br />offline</p>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-[#E8302A]" />
                  </div>
                  <p className="text-xs text-gray-600 leading-tight">Home<br />screen</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500 text-center mb-4">
              Add TindaPOS to your home screen for a full-screen app experience — no browser bar.
            </p>

            <Button
              onClick={handleInstall}
              disabled={installing}
              className="w-full bg-[#E8302A] hover:bg-[#B91C1C] text-white font-semibold h-11 rounded-xl"
            >
              <Download className="w-4 h-4 mr-2" />
              {installing ? 'Installing…' : 'Install App'}
            </Button>

            <button
              onClick={handleDismiss}
              className="w-full mt-2 text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
