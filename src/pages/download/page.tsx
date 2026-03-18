import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Monitor,
  Smartphone,
  Apple,
  Download,
  Globe,
  CheckCircle,
  ArrowLeft,
  Wifi,
  WifiOff,
  Laptop,
  Zap,
  MessageCircle
} from "lucide-react"

const FACEBOOK_PAGE_URL = "https://m.me/61582747590992"

export default function DownloadPage() {
  const [androidStepsOpen, setAndroidStepsOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="TindaPOS" className="w-9 h-9 object-contain" />
            <span className="font-bold text-gray-900 text-lg">TindaPOS</span>
          </div>
          <Link to="/login">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Get TindaPOS</h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Install TindaPOS on your device for the best experience. Available on Windows, Android, and iOS.
          </p>
        </div>

        {/* Download Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

          {/* Windows Desktop */}
          <Card className="border-2 hover:border-blue-300 transition-colors">
    <CardHeader className="pb-3">
      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
        <Monitor className="h-6 w-6 text-blue-600" />
      </div>
      <CardTitle className="text-lg">Windows Desktop</CardTitle>
      <CardDescription>Install the desktop app for Windows PCs</CardDescription>
    </CardHeader>

    <CardContent className="space-y-4">
      <ul className="space-y-2 text-sm text-gray-600">
        <Feature icon={<WifiOff className="h-3.5 w-3.5" />} text="Works offline after install" />
        <Feature icon={<Zap className="h-3.5 w-3.5" />} text="Fast & lightweight desktop experience" />
        <Feature icon={<CheckCircle className="h-3.5 w-3.5" />} text="Install via browser (PWA) — no .exe needed" />
      </ul>

      <Separator />

      <a href={FACEBOOK_PAGE_URL} target="_blank" rel="noopener noreferrer">
        <Button className="w-full bg-[#1877F2] hover:bg-[#1565C0] gap-2">
          <MessageCircle className="h-4 w-4" />
          Contact us on Facebook
        </Button>
      </a>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        <p className="font-medium mb-1">Want the desktop app?</p>
        <p>
          You can also install TindaPOS as a desktop app on Windows via Chrome or Edge — no download required.
          Check the <strong>Android &amp; Desktop (PWA)</strong> card for install steps.
        </p>
      </div>
    </CardContent>
  </Card>

          {/* Android */}
<Card className="border-2 hover:border-green-300 transition-colors">
  <CardHeader className="pb-3">
    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3">
      <Smartphone className="h-6 w-6 text-green-600" />
    </div>
    <div className="flex items-center gap-2">
      <CardTitle className="text-lg">Android & Desktop</CardTitle>
      <Badge variant="secondary" className="text-xs">PWA</Badge>
    </div>
    <CardDescription>Install on Android, Windows, or Mac via browser</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <ul className="space-y-2 text-sm text-gray-600">
      <Feature icon={<Wifi className="h-3.5 w-3.5" />} text="Requires internet connection" />
      <Feature icon={<CheckCircle className="h-3.5 w-3.5" />} text="Works on phone, tablet & desktop" />
      <Feature icon={<CheckCircle className="h-3.5 w-3.5" />} text="Staff login supported" />
      <Feature icon={<CheckCircle className="h-3.5 w-3.5" />} text="Installable from any browser" />
    </ul>
    <Separator />
    <div className="space-y-2">
      <Button variant="outline" className="w-full gap-2" disabled>
        <Download className="h-4 w-4" />
        APK — Coming Soon
      </Button>
      <Button
        className="w-full bg-green-600 hover:bg-green-700 gap-2"
        onClick={() => setAndroidStepsOpen(!androidStepsOpen)}
      >
        <Globe className="h-4 w-4" />
        {androidStepsOpen ? 'Hide Install Guide' : 'How to Install (PWA)'}
      </Button>
    </div>

    {androidStepsOpen && (
      <div className="space-y-3 text-sm">

        {/* Android */}
        <div className="bg-green-50 rounded-lg p-3 space-y-2 text-green-800">
          <p className="font-semibold flex items-center gap-2">
            <Smartphone className="h-4 w-4" /> Android (Chrome)
          </p>
          <ol className="space-y-1 list-decimal list-inside">
            <li>Open the app in <strong>Chrome</strong></li>
            <li>Tap the <strong>⋮ menu</strong> (top right)</li>
            <li>Tap <strong>"Add to Home screen"</strong></li>
            <li>Tap <strong>Add</strong> to confirm</li>
          </ol>
        </div>

        {/* Windows */}
        <div className="bg-blue-50 rounded-lg p-3 space-y-2 text-blue-800">
          <p className="font-semibold flex items-center gap-2">
            <Monitor className="h-4 w-4" /> Windows (Chrome / Edge)
          </p>
          <ol className="space-y-1 list-decimal list-inside">
            <li>Open the app in <strong>Chrome</strong> or <strong>Edge</strong></li>
            <li>Click the <strong>install icon</strong> in the address bar (⊕)</li>
            <li>Click <strong>"Install"</strong> to confirm</li>
            <li>App opens like a regular desktop program</li>
          </ol>
        </div>

        {/* Mac */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-gray-800">
          <p className="font-semibold flex items-center gap-2">
            <Laptop className="h-4 w-4" /> Mac (Chrome / Safari)
          </p>
          <ol className="space-y-1 list-decimal list-inside">
            <li>Open the app in <strong>Chrome</strong> or <strong>Safari</strong></li>
            <li>
              Chrome: click the <strong>install icon ⊕</strong> in the address bar<br />
              Safari: click <strong>Share → Add to Dock</strong>
            </li>
            <li>Click <strong>Install / Add</strong> to confirm</li>
          </ol>
        </div>

      </div>
    )}
  </CardContent>
</Card>

          {/* iPhone / iPad */}
          <Card className="border-2 border-dashed border-gray-200 opacity-70">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                <Apple className="h-6 w-6 text-gray-400" />
              </div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg text-gray-400">iPhone / iPad</CardTitle>
                <Badge variant="outline" className="text-xs text-gray-400 border-gray-300">Coming Soon</Badge>
              </div>
              <CardDescription>iOS app is currently in development</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-gray-400">
                <Feature icon={<CheckCircle className="h-3.5 w-3.5" />} text="Works on iPhone & iPad" />
                <Feature icon={<CheckCircle className="h-3.5 w-3.5" />} text="Staff login supported" />
                <Feature icon={<CheckCircle className="h-3.5 w-3.5" />} text="Add to Home Screen" />
              </ul>
              <Separator />
              <Button variant="outline" className="w-full gap-2" disabled>
                <Apple className="h-4 w-4" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Web App Option */}
        <Card className="bg-blue-50 border-blue-200 mb-8">
          <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <Globe className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-blue-900">Just want to use the browser?</p>
                <p className="text-sm text-blue-700">No installation needed — log in directly from any browser.</p>
              </div>
            </div>
            <Link to="/login">
              <Button className="bg-[#E8302A] hover:bg-[#B91C1C] shrink-0 gap-2">
                <Globe className="h-4 w-4" />
                Open Web App
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400">
          <p>TindaPOS v2.0.0 · © 2025 Mustard Digitals</p>
        </div>
      </div>
    </div>
  )
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className="text-gray-400 shrink-0">{icon}</span>
      <span>{text}</span>
    </li>
  )
}
