// src/components/auth/logout-button.jsx

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { LogOut, Loader2 } from "lucide-react"
import authService from "@/services/authService"

type ButtonVariant = "link" | "default" | "destructive" | "outline" | "secondary" | "ghost"
type ButtonSize = "default" | "sm" | "lg" | "icon"

export function LogoutButton({
  variant = "ghost" as ButtonVariant,
  size = "default" as ButtonSize,
  showIcon = true,
  showText = true,
  className = "",
  asDropdownItem = false
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  showIcon?: boolean
  showText?: boolean
  className?: string
  asDropdownItem?: boolean
}) {
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showDialog, setShowDialog] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    
    try {
      // Call logout service
      const result = await authService.logout()
      
      if (result.success) {
        // Redirect to login page
        navigate("/login")
      } else {
        console.error("Logout failed:", result.error)
        // Even if server logout fails, redirect to login
        navigate("/login")
      }
    } catch (error) {
      console.error("Logout error:", error)
      // Force redirect even on error
      navigate("/login")
    } finally {
      setIsLoggingOut(false)
      setShowDialog(false)
    }
  }

  // If used as dropdown item (no dialog)
  if (asDropdownItem) {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 w-full"
      >
        {isLoggingOut ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Logging out...
          </>
        ) : (
          <>
            {showIcon && <LogOut className="mr-2 h-4 w-4" />}
            {showText && "Sign out"}
          </>
        )}
      </button>
    )
  }

  // Regular button with confirmation dialog
  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogTrigger asChild>
        <Button 
          variant={variant as ButtonVariant}
          size={size as ButtonSize}
          className={className}
        >
          {showIcon && <LogOut className={showText ? "mr-2 h-4 w-4" : "h-4 w-4"} />}
          {showText && "Sign out"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to sign out? Any unsaved changes will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoggingOut}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing out...
              </>
            ) : (
              "Sign out"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Quick logout button without confirmation
export function QuickLogoutButton({ 
  variant = "ghost", 
  size = "default", 
  showIcon = true,
  showText = true,
  className = ""
}) {
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    
    try {
      await authService.logout()
      navigate("/login")
    } catch (error) {
      console.error("Logout error:", error)
      navigate("/login")
    }
  }

  return (
    <Button 
      variant={variant as ButtonVariant}
      size={size as ButtonSize}
      className={className}
      onClick={handleLogout}
      disabled={isLoggingOut}
    >
      {isLoggingOut ? (
        <>
          <Loader2 className={showText ? "mr-2 h-4 w-4" : "h-4 w-4"} />
          {showText && "Signing out..."}
        </>
      ) : (
        <>
          {showIcon && <LogOut className={showText ? "mr-2 h-4 w-4" : "h-4 w-4"} />}
          {showText && "Sign out"}
        </>
      )}
    </Button>
  )
}