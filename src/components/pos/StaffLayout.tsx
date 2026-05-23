import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/ui/app-sidebar'
import { useAuth } from '@/components/auth/AuthProvider'

export function StaffLayout({ children }: { children: React.ReactNode }) {
  const { user, userType, company } = useAuth()
  return (
    <SidebarProvider>
      <AppSidebar userType={userType as string} user={user} company={company} />
      <SidebarInset className="min-w-0">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
