import { useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, Mail, CheckCircle } from "lucide-react"
import API_CONFIG from "@/config/api"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  const handleSubmit = async () => {
    setError("")
    if (!email) {
      setError("Please enter your email address.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (res.ok) {
        setSent(true)
      } else {
        setError(data.error || "Something went wrong. Please try again.")
      }
    } catch {
      setError("Connection failed. Please check your internet connection.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-6">
        <img src="/NEW-pos-logo.png" alt="TindaPOS" className="w-16 h-16 mx-auto mb-4 object-contain" />
        <h1 className="text-2xl font-bold text-gray-900">TindaPOS</h1>
        <p className="text-gray-600">Ang POS para sa bawat tindahan.</p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {sent ? (
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
          ) : (
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail className="h-7 w-7 text-[#E8302A]" />
            </div>
          )}
          <CardTitle className="text-xl">
            {sent ? "Check your email" : "Forgot your password?"}
          </CardTitle>
          <CardDescription>
            {sent
              ? `We sent a reset link to ${email}. Check your inbox (and spam folder).`
              : "Enter your business email and we'll send you a reset link."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!sent ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Business Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="manager@yourcompany.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  disabled={loading}
                />
              </div>

              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleSubmit}
                className="w-full bg-[#E8302A] hover:bg-[#B91C1C]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Reset Link
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => { setSent(false); setEmail("") }}
              variant="outline"
              className="w-full"
            >
              Try a different email
            </Button>
          )}

          <div className="text-center mt-6 pt-4 border-t">
            <Link
              to="/login"
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">TindaPOS v2.0.0 · © 2026 Mustard Digitals</p>
      </div>
    </div>
  )
}
