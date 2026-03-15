
import { AdminProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function AdminLayout({ children }) {
  return (
    <AdminProtectedRoute>
      {children}
    </AdminProtectedRoute>
  )
}