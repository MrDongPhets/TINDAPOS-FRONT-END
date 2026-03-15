// @ts-nocheck
// src/components/ui/success-modal.jsx - Centered success modal like in your image

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CheckCircle } from "lucide-react"

export function SuccessModal({ 
  open, 
  onOpenChange, 
  title = "Congratulations!", 
  description = "You entered the correct answer!",
  buttonText = "OK"
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[400px] text-center">
        <AlertDialogHeader className="items-center space-y-6">
          {/* Green checkmark circle */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <div className="space-y-3">
            <AlertDialogTitle className="text-xl font-semibold text-gray-900">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 text-base">
              {description}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        
        <div className="flex justify-center pt-4">
          <AlertDialogAction className="bg-[#E8302A] hover:bg-[#E8302A] text-white px-8 py-2 rounded-md">
            {buttonText}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}