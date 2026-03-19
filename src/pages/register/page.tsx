// src/app/register/page.jsx - Fixed hardcoded localhost

import { useState, useEffect } from "react"
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, UserPlus, ArrowLeft, Check, X, Zap, Star, ChevronRight, Eye, EyeOff } from "lucide-react"
import API_CONFIG from "@/config/api" // Import API config

const subscriptionPlans = [
  {
    id: 'negosyo',
    name: 'Negosyo',
    price: 299,
    duration: 'per month',
    trialDays: 30,
    features: [
      '1 Store',
      'Up to 250 Products',
      'Up to 3 Staff Accounts',
      'Inventory Tracking & Alerts',
      'Daily & Monthly Sales Reports',
      'Stock Adjustments',
      'Facebook Support',
      'POS Checkout & Receipt (Coming Soon)',
      'Email Support (Coming Soon)',
    ],
    icon: <Zap className="h-5 w-5" />,
    color: 'bg-red-100 text-red-800',
    recommended: true,
    disabled: false
  },
  {
    id: 'laking-negosyo',
    name: 'Laking Negosyo',
    price: 599,
    duration: 'per month',
    trialDays: 30,
    features: [
      'Up to 5 Stores',
      'Unlimited Products',
      'Unlimited Staff Accounts',
      'Everything in Negosyo',
      'Inventory Transfer Across Branches',
      'Advanced Financial Reports',
      'Custom Receipt Logo',
      'Multi-store Management',
      'Priority Support',
    ],
    icon: <Star className="h-5 w-5" />,
    color: 'bg-orange-100 text-orange-800',
    recommended: false,
    disabled: false
  }
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Company Information
  const [companyData, setCompanyData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    website: ""
  })

  // User Information
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: ""
  })

  // Selected subscription plan
  const [selectedPlan, setSelectedPlan] = useState('basic')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Password strength validation
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false
  })

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userType = localStorage.getItem('userType')

    if (token && userType === 'client') {
      navigate('/client/dashboard')
    }
  }, [navigate])

  // Pre-fill from Google OAuth redirect (?google=true&email=...&name=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('google') === 'true') {
      const email = params.get('email') || ''
      const name = params.get('name') || ''
      setUserData(prev => ({ ...prev, email, name }))
      setCompanyData(prev => ({ ...prev, email }))
      window.history.replaceState({}, '', '/register')
    }
  }, [])

  // Check password strength
  useEffect(() => {
    const password = userData.password
    setPasswordStrength({
      hasMinLength: password.length >= 6,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password)
    })
  }, [userData.password])

  const handleCompanyInputChange = (field, value) => {
    setCompanyData(prev => ({ ...prev, [field]: value }))
    setError("")
  }

  const handleUserInputChange = (field, value) => {
    setUserData(prev => ({ ...prev, [field]: value }))
    setError("")
  }

  const validateStep1 = () => {
    if (!companyData.name || !companyData.email) {
      setError("Company name and email are required")
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(companyData.email)) {
      setError("Please enter a valid company email address")
      return false
    }

    return true
  }

  const validateStep2 = () => {
    if (!userData.name || !userData.email || !userData.password) {
      setError("Name, email, and password are required")
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(userData.email)) {
      setError("Please enter a valid email address")
      return false
    }

    if (userData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      return false
    }

    if (userData.password !== userData.confirmPassword) {
      setError("Passwords do not match")
      return false
    }

    return true
  }

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2)
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError("")
    }
  }

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) return

    setError("")
    setLoading(true)

    try {
      // FIXED: Use correct API URL
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/register-company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: companyData,
          user: userData,
          subscription: {
            plan: selectedPlan,
            planDetails: subscriptionPlans.find(p => p.id === selectedPlan)
          }
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess(true)
        setTimeout(() => navigate("/login"), 3000)
      } else {
        if (data.code === 'USER_EXISTS') {
          setCurrentStep(2)
          setError("This email is already registered. Please use a different email or sign in.")
        } else if (data.code === 'COMPANY_EXISTS') {
          setCurrentStep(1)
          setError("A business account with this email already exists. Please use a different email or sign in.")
        } else {
          setError(data.error || "Registration failed. Please try again.")
        }
      }
    } catch (err) {
      setError("Unable to connect to server. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrengthColor = () => {
    const score = Object.values(passwordStrength).filter(Boolean).length
    if (score <= 1) return "text-red-500"
    if (score <= 2) return "text-orange-500"
    if (score <= 3) return "text-yellow-500"
    return "text-green-500"
  }

  const getPasswordStrengthText = () => {
    const score = Object.values(passwordStrength).filter(Boolean).length
    if (score === 0) return ""
    if (score <= 1) return "Weak"
    if (score <= 2) return "Fair" 
    if (score <= 3) return "Good"
    return "Strong"
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
            <p className="text-gray-600 mb-4">
              Your business account has been created successfully. You can now sign in to access your dashboard.
            </p>
            <div className="text-sm text-gray-500">
              Redirecting to login page...
            </div>
            <Loader2 className="h-6 w-6 animate-spin mx-auto mt-4 text-gray-400" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Back Link */}
      <div className="w-full max-w-4xl mb-4">
        <Link to="/login">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="text-center mb-6">
        <img src="/NEW-pos-logo.png" alt="TindaPOS" className="w-16 h-16 mx-auto mb-4 object-contain" />
        <h1 className="text-2xl font-bold text-gray-900">Start Your Business Account</h1>
        <p className="text-gray-600">Get your POS system up and running in minutes</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= step 
                ? 'bg-[#E8302A] text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {step}
            </div>
            {step < 3 && (
              <div className={`w-12 h-0.5 ml-4 ${
                currentStep > step ? 'bg-[#E8302A]' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="w-full max-w-4xl">
        <CardContent className="p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold">Company Information</h2>
                <p className="text-gray-600">Tell us about your business</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Name *</label>
                  <Input
                    placeholder="Your Business Name"
                    value={companyData.name}
                    onChange={(e) => handleCompanyInputChange('name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Email *</label>
                  <Input
                    type="email"
                    placeholder="contact@yourbusiness.com"
                    value={companyData.email}
                    onChange={(e) => handleCompanyInputChange('email', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={companyData.phone}
                    onChange={(e) => handleCompanyInputChange('phone', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Website</label>
                  <Input
                    type="url"
                    placeholder="https://www.yourbusiness.com"
                    value={companyData.website}
                    onChange={(e) => handleCompanyInputChange('website', e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Business Address</label>
                  <Input
                    placeholder="123 Main St, City, State, ZIP"
                    value={companyData.address}
                    onChange={(e) => handleCompanyInputChange('address', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold">Administrator Account</h2>
                <p className="text-gray-600">Create your business manager account</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name *</label>
                  <Input
                    placeholder="John Doe"
                    value={userData.name}
                    onChange={(e) => handleUserInputChange('name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address *</label>
                  <Input
                    type="email"
                    placeholder="you@yourbusiness.com"
                    value={userData.email}
                    onChange={(e) => handleUserInputChange('email', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={userData.phone}
                    onChange={(e) => handleUserInputChange('phone', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Password *</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={userData.password}
                      onChange={(e) => handleUserInputChange('password', e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {userData.password && (
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Password Strength:</span>
                        <span className={`text-xs font-medium ${getPasswordStrengthColor()}`}>
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {passwordStrength.hasMinLength ? 
                            <Check className="h-3 w-3 text-green-500" /> : 
                            <X className="h-3 w-3 text-gray-300" />
                          }
                          <span className={`text-xs ${passwordStrength.hasMinLength ? 'text-green-600' : 'text-gray-400'}`}>
                            At least 6 characters
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordStrength.hasUpperCase ? 
                            <Check className="h-3 w-3 text-green-500" /> : 
                            <X className="h-3 w-3 text-gray-300" />
                          }
                          <span className={`text-xs ${passwordStrength.hasUpperCase ? 'text-green-600' : 'text-gray-400'}`}>
                            Contains uppercase letter
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordStrength.hasNumber ? 
                            <Check className="h-3 w-3 text-green-500" /> : 
                            <X className="h-3 w-3 text-gray-300" />
                          }
                          <span className={`text-xs ${passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                            Contains number
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 md:col-start-2">
                  <label className="text-sm font-medium">Confirm Password *</label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={userData.confirmPassword}
                      onChange={(e) => handleUserInputChange('confirmPassword', e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {userData.confirmPassword && userData.password !== userData.confirmPassword && (
                    <p className="text-xs text-red-500">Passwords do not match</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold">Choose Your Plan</h2>
                <p className="text-gray-600">Select a subscription plan that fits your business</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto w-full">
                {subscriptionPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative p-6 border-2 rounded-lg transition-all ${
                      plan.disabled
                        ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                        : selectedPlan === plan.id
                          ? 'border-red-500 bg-red-50 cursor-pointer'
                          : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                    }`}
                    onClick={() => !plan.disabled && setSelectedPlan(plan.id)}
                  >
                    {plan.recommended && (
                      <Badge className="absolute -top-2 left-4 bg-green-500 text-white">
                        1 Month Free
                      </Badge>
                    )}
                    {plan.disabled && (
                      <Badge className="absolute -top-2 left-4 bg-gray-400 text-white">
                        Coming Soon
                      </Badge>
                    )}

                    <div className="text-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${plan.color}`}>
                        {plan.icon}
                      </div>
                      <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
                      {plan.trialDays > 0 && (
                        <p className="text-xs text-green-600 font-medium mb-3">
                          {plan.trialDays} days free, then ₱{plan.price}/{plan.duration}
                        </p>
                      )}
                      <div className="mb-4">
                        <span className="text-3xl font-bold">₱{plan.price}</span>
                        <span className="text-gray-500 ml-1">/{plan.duration}</span>
                      </div>
                      <ul className="space-y-2 text-sm text-left">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {selectedPlan === plan.id && !plan.disabled && (
                      <div className="absolute top-4 right-4">
                        <div className="w-6 h-6 bg-[#E8302A] rounded-full flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert className="bg-red-50 border-red-200 mt-6">
              <AlertDescription className="text-red-800">
                {error}{" "}
                {(error.includes("already registered") || error.includes("already exists")) && (
                  <Link to="/login" className="font-semibold underline">
                    Sign in instead
                  </Link>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || loading}
            >
              Back
            </Button>

            {currentStep < 3 ? (
              <Button
                onClick={handleNext}
                className="bg-[#E8302A] hover:bg-[#B91C1C]"
                disabled={loading}
              >
                Next Step
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="bg-[#E8302A] hover:bg-[#B91C1C]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Business Account
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          By registering, you agree to our Terms of Service and Privacy Policy
        </p>
        <p className="text-xs text-gray-400 mt-2">
          TindaPOS v2.0.0 · © 2026 Mustard Digitals · tindapos.mrdongphets.com
        </p>
      </div>
    </div>
  )
}