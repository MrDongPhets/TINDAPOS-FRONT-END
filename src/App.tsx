import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { Toaster } from '@/components/ui/toaster'
import { OfflineBanner } from '@/components/ui/OfflineBanner'
import { useOfflineSync } from '@/hooks/useOfflineSync'

// Setup
import SetupPage from '@/pages/setup/page'

// Auth / public pages
import LoginPage from '@/pages/login/page'
import RegisterPage from '@/pages/register/page'
import SystemAdminPage from '@/pages/system-admin/page'
import StaffLoginPage from '@/pages/staff/login/page'
import DownloadPage from '@/pages/download/page'
import ForgotPasswordPage from '@/pages/forgot-password/page'
import ResetPasswordPage from '@/pages/reset-password/page'

// Admin pages
import AdminDashboard from '@/pages/admin/dashboard/page'
import AdminStoreRequests from '@/pages/admin/store-requests/page'
import AdminSubscriptions from '@/pages/admin/subscriptions/page'

// Client pages
import ClientDashboard from '@/pages/client/dashboard/page'
import ClientPos from '@/pages/client/pos/page'
import ChangePasscode from '@/pages/client/pos/settings/change-passcode/page'
import CategoriesPage from '@/pages/client/inventory/categories/page'
import IngredientsPage from '@/pages/client/inventory/ingredients/page'
import IngredientsTrackingPage from '@/pages/client/inventory/ingredients-tracking/page'
import ProductsPage from '@/pages/client/inventory/products/page'
import TrackingPage from '@/pages/client/inventory/tracking/page'
import TransferPage from '@/pages/client/inventory/transfer/page'
import ReportsPage from '@/pages/client/reports/page'
import FinancialReportsPage from '@/pages/client/reports/financial/page'
import InventoryReportsPage from '@/pages/client/reports/inventory/page'
import SalesReportsPage from '@/pages/client/reports/sales/page'
import SalesPage from '@/pages/client/sales/page'
import SaleDetailPage from '@/pages/client/sales/detail/page'
import StaffPage from '@/pages/client/staff/page'
import ActivityLogsPage from '@/pages/client/staff/activity-logs/page'
import StoresPage from '@/pages/client/stores/page'
import StoreRequestPage from '@/pages/client/stores/request/page'
import SubscriptionExpiredPage from '@/pages/client/subscription-expired/page'
import SettingsPage from '@/pages/client/settings/page'
import UtangPage from '@/pages/client/utang/page'

// Staff POS
import PosPage from '@/pages/pos/page'

function AppContent() {
  useOfflineSync();
  return null;
}

function App() {
  return (
    <AuthProvider>
      <OfflineBanner />
      <AppContent />
      <Routes>
        {/* Setup (offline first-run) */}
        <Route path="/setup" element={<SetupPage />} />

        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/system-admin" element={<SystemAdminPage />} />
        <Route path="/staff/login" element={<StaffLoginPage />} />
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Admin routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/store-requests" element={<AdminStoreRequests />} />
        <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />

        {/* Client routes */}
        <Route path="/client/dashboard" element={<ClientDashboard />} />
        <Route path="/client/pos" element={<ClientPos />} />
        <Route path="/client/pos/settings/change-passcode" element={<ChangePasscode />} />
        <Route path="/client/inventory/categories" element={<CategoriesPage />} />
        <Route path="/client/inventory/ingredients" element={<IngredientsPage />} />
        <Route path="/client/inventory/ingredients-tracking" element={<IngredientsTrackingPage />} />
        <Route path="/client/inventory/products" element={<ProductsPage />} />
        <Route path="/client/inventory/tracking" element={<TrackingPage />} />
        <Route path="/client/inventory/transfer" element={<TransferPage />} />
        <Route path="/client/reports" element={<ReportsPage />} />
        <Route path="/client/reports/financial" element={<FinancialReportsPage />} />
        <Route path="/client/reports/inventory" element={<InventoryReportsPage />} />
        <Route path="/client/reports/sales" element={<SalesReportsPage />} />
        <Route path="/client/sales" element={<SalesPage />} />
        <Route path="/client/sales/:id" element={<SaleDetailPage />} />
        <Route path="/client/staff" element={<StaffPage />} />
        <Route path="/client/staff/activity-logs" element={<ActivityLogsPage />} />
        <Route path="/client/stores" element={<StoresPage />} />
        <Route path="/client/stores/request" element={<StoreRequestPage />} />
        <Route path="/client/subscription-expired" element={<SubscriptionExpiredPage />} />
        <Route path="/client/settings" element={<SettingsPage />} />
        <Route path="/client/utang" element={<UtangPage />} />

        {/* Staff POS */}
        <Route path="/pos" element={<PosPage />} />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster />
    </AuthProvider>
  )
}

export default App
