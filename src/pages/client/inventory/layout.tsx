// src/app/client/inventory/layout.jsx

import { ClientProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function InventoryLayout({ children }) {
  return (
    <ClientProtectedRoute>
      {children}
    </ClientProtectedRoute>
  )
}