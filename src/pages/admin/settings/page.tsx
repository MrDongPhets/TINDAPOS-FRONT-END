import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/ui/app-sidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Settings, User, LogOut, Shield, Bell, Mail, Phone, Clock } from 'lucide-react'

function formatDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getInitials(name: string) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

export default function AdminSettings() {
  const navigate = useNavigate()

  const rawUser = localStorage.getItem('userData')
  const adminUser = rawUser ? JSON.parse(rawUser) : null

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userData')
    localStorage.removeItem('userType')
    localStorage.removeItem('companyData')
    localStorage.removeItem('subscriptionData')
    navigate('/system-admin')
  }

  return (
    <SidebarProvider>
      <AppSidebar userType="super_admin" />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/admin/dashboard">Admin</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Content */}
        <div className="flex flex-col gap-6 p-6 max-w-2xl">
          {/* Title */}
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-sm text-muted-foreground">Super admin account and preferences</p>
            </div>
          </div>

          {/* Profile card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Profile
              </CardTitle>
              <CardDescription>Your super admin account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                  {getInitials(adminUser?.name || '')}
                </div>
                <div>
                  <p className="font-semibold text-lg">{adminUser?.name || '—'}</p>
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200 border text-xs" variant="outline">
                    <Shield className="h-3 w-3 mr-1" />
                    Super Admin
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Details */}
              <div className="space-y-3">
                {adminUser?.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground w-24 shrink-0">Email</span>
                    <span className="font-medium">{adminUser.email}</span>
                  </div>
                )}
                {adminUser?.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground w-24 shrink-0">Phone</span>
                    <span className="font-medium">{adminUser.phone}</span>
                  </div>
                )}
                {adminUser?.last_login && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground w-24 shrink-0">Last login</span>
                    <span className="font-medium">{formatDate(adminUser.last_login)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Permissions card */}
          {adminUser?.permissions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4" />
                  Permissions
                </CardTitle>
                <CardDescription>Your granted super admin permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(adminUser.permissions)
                    .filter(([, v]) => v === true)
                    .map(([key]) => (
                      <Badge
                        key={key}
                        className="bg-blue-100 text-blue-800 border-blue-200 border capitalize text-xs"
                        variant="outline"
                      >
                        {key.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications placeholder */}
          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4" />
                Notifications
                <Badge variant="outline" className="text-xs ml-1">Coming soon</Badge>
              </CardTitle>
              <CardDescription>Email alerts for new company registrations and system events</CardDescription>
            </CardHeader>
          </Card>

          {/* Logout */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-base text-red-700">Sign Out</CardTitle>
              <CardDescription>End your current admin session</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
