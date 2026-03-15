import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, KeyRound, CheckCircle, XCircle } from "lucide-react"
import API_CONFIG from "@/config/api"

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [token, setToken] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get("token")
    if (!t) {
      setError("Invalid reset link. Please request a new one.")
    } else {
      setToken(t)
    }
  }, [])

  const handleSubmit = async () => {
    setError("")

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => navigate("/login?message=Password+updated+successfully"), 2500)
      } else {
        setError(data.error || "Failed to reset password. Please try again.")
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
        <img src="/logo.png" alt="TindaPOS" className="w-16 h-16 mx-auto mb-4 object-contain" />
        <h1 className="text-2xl font-bold text-gray-900">TindaPOS</h1>
        <p className="text-gray-600">Ang POS para sa bawat tindahan.</p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${success ? "bg-green-100" : "bg-red-50"}`}>
            {success
              ? <CheckCircle className="h-7 w-7 text-green-600" />
              : <KeyRound className="h-7 w-7 text-[#E8302A]" />
            }
          </div>
          <CardTitle className="text-xl">
            {success ? "Password updated!" : "Set a new password"}
          </CardTitle>
          <CardDescription>
            {success
              ? "Redirecting you to login..."
              : "Choose a strong password for your account."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!success ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || !token}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  disabled={loading || !token}
                />
              </div>

              {/* Password match indicator */}
              {confirmPassword && (
                <p className={`text-xs flex items-center gap-1 ${password === confirmPassword ? "text-green-600" : "text-red-500"}`}>
                  {password === confirmPassword
                    ? <><CheckCircle className="h-3.5 w-3.5" /> Passwords match</>
                    : <><XCircle className="h-3.5 w-3.5" /> Passwords do not match</>
                  }
                </p>
              )}

              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleSubmit}
                className="w-full bg-[#E8302A] hover:bg-[#B91C1C]"
                disabled={loading || !token}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>

              <div className="text-center pt-2">
                <Link to="/forgot-password" className="text-sm text-[#E8302A] hover:text-[#B91C1C]">
                  Request a new reset link
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <Loader2 className="h-5 w-5 animate-spin text-[#E8302A] mx-auto" />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">TindaPOS v2.0.0 · © 2026 Mustard Digitals</p>
      </div>
    </div>
  )
}
