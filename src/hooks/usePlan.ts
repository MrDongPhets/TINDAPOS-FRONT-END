import { useAuth } from '@/components/auth/AuthProvider'
import { IS_STAGING } from '@/lib/staging'

export function usePlan() {
  const { subscription } = useAuth()

  const planName: string = subscription?.plan_name || 'basic'
  const features = subscription?.features || {}

  // Trial users get full access to everything — and so does everyone on the staging server
  const isTrial = planName === 'trial' || IS_STAGING

  // Advanced reports: trial OR plan has reports feature enabled (Laking Negosyo 599)
  const hasAdvancedReports = isTrial || features?.reports === true

  return {
    planName,
    isTrial,
    hasAdvancedReports,
    canExportCSV: hasAdvancedReports,
    canAccessInventoryReports: hasAdvancedReports,
    canAccessFinancialReports: hasAdvancedReports,
    canAccessStaffPerformance: hasAdvancedReports,
    canUseBiometric: hasAdvancedReports,
  }
}
