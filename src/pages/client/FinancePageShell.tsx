import { AppSidebar } from '@/components/ui/app-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { UserMenuDropdown } from '@/components/ui/UserMenuDropdown'
import { useAuth } from '@/components/auth/AuthProvider'

// Owner page frame (sidebar + header) for the GCash and Expenses pages
export function FinancePageShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const { user, company } = useAuth()
  return (
    <SidebarProvider>
      <AppSidebar userType="client" user={user} company={company} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 overflow-hidden">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center overflow-hidden">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold truncate">{title}</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">{subtitle}</p>
            </div>
          </div>
          <UserMenuDropdown />
        </header>
        <div className="p-4 pb-24">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
