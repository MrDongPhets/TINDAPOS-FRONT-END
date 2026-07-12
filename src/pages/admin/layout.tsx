import { Outlet } from 'react-router-dom'
import { AdminProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function AdminLayout() {
  return (
    <AdminProtectedRoute>
      <Outlet />
    </AdminProtectedRoute>
  )
}