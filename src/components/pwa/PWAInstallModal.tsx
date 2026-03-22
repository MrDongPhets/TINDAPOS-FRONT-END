import { useState, useEffect } from 'react'
import { X, Download, Smartphone, Zap, WifiOff, AlertTriangle, Users, Share, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  )
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

function isSafariBrowser(): boolean {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
}

const DISMISS_KEY = 'pwa_install_dismissed'
const DISMISS_DAYS = 7

function wasDismissedRecently(): boolean {
  const ts = localStorage.getItem(DISMISS_KEY)
  if (!ts) return false
  return Date.now() - parseInt(ts) < DISMISS_DAYS * 24 * 60 * 60 * 1000
}

export function PWAInstallModal() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [show, setShow] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [iosMode, setIosMode] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    if (wasDismissedRecently()) return

    const ios = isIOS() && isSafariBrowser()

    if (ios) {
      setIosMode(true)
      setTimeout(() => setShow(true), 1500)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setTimeout(() => setShow(true), 800)
    }

    window.addEventListener('beforeinstallprompt', handler)
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
                <img src="/NEW-pos-logo.png" alt="TindaPOS" className="w-9 h-9 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
              <div>
                <p className="text-white font-bold text-lg leading-tight">TindaPOS</p>
                <p className="text-white/80 text-xs">Install for the best experience</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-5 pt-4 pb-5 -mt-4">
            {/* Benefits */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
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

            {iosMode ? (
              /* iOS Safari: show step-by-step instructions */
              <div className="space-y-2 mb-4">
                <p className="text-sm font-semibold text-gray-800 mb-2">How to install on iPhone/iPad:</p>
                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">1</div>
                  <p className="text-xs text-blue-900 leading-snug">
                    Tap the <Share className="inline w-3.5 h-3.5 mx-0.5 -mt-0.5" /> <strong>Share</strong> button at the bottom of Safari
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">2</div>
                  <p className="text-xs text-blue-900 leading-snug">
                    Scroll down and tap <Plus className="inline w-3.5 h-3.5 mx-0.5 -mt-0.5" /> <strong>Add to Home Screen</strong>
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">3</div>
                  <p className="text-xs text-blue-900 leading-snug">
                    Tap <strong>Add</strong> in the top-right corner
                  </p>
                </div>
              </div>
            ) : (
              /* Chrome/Android: show notices + install button */
              <div className="space-y-2 mb-4">
                <div className="flex gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-800 mb-0.5">Business account required</p>
                    <p className="text-xs text-amber-700 leading-snug">
                      Registration is only available on the website. Make sure you have an account before installing.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <Users className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-blue-800 mb-0.5">Staff &amp; cashier login</p>
                    <p className="text-xs text-blue-700 leading-snug">
                      Staff login is only accessible inside the installed app, not in the browser.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!iosMode && (
              <Button
                onClick={handleInstall}
                disabled={installing}
                className="w-full bg-[#E8302A] hover:bg-[#B91C1C] text-white font-semibold h-11 rounded-xl"
              >
                <Download className="w-4 h-4 mr-2" />
                {installing ? 'Installing…' : 'Install App'}
              </Button>
            )}

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
