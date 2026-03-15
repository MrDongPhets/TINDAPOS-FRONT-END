// src/app/client/layout.jsx
import { AuthProvider } from '@/components/auth/AuthProvider'
import { Toaster } from '@/components/ui/toaster'

export default function ClientLayout({ children }) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  )
}