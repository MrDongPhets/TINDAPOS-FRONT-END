import { useAuth } from '@/components/auth/AuthProvider'
import { usePlan } from '@/hooks/usePlan'
import { AppSidebar } from '@/components/ui/app-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserMenuDropdown } from '@/components/ui/UserMenuDropdown'
import {
  Check, MessageCircle, Store, Building2, Lock,
  CreditCard, Calendar, AlertCircle
} from 'lucide-react'

const PLANS = [
  {
    key: 'negosyo',
    name: 'Negosyo',
    price: '₱299',
    period: '/month',
    icon: Store,
    color: 'border-[#E8302A]',
    badgeColor: 'bg-red-100 text-[#E8302A]',
    perks: [
      '1 tindahan, hanggang 100 products',
      'POS checkout at resibo',
      'Inventory tracking at alerts',
      'Daily at monthly sales reports',
      'Up to 3 staff accounts',
      'Staff attendance tracking',
      'Facebook support',
    ],
  },
  {
    key: 'laking_negosyo',
    name: 'Laking Negosyo',
    price: '₱599',
    period: '/month',
    icon: Building2,
    color: 'border-purple-400',
    badgeColor: 'bg-purple-100 text-purple-700',
    perks: [
      'Lahat ng nasa Negosyo plan',
      'Hanggang 5 branches',
      'Inventory transfer sa branches',
      'Unlimited staff accounts',
      'Staff attendance + biometric clock-in',
      'Advanced financial reports',
      'Priority support',
    ],
  },
]

export default function SubscriptionPage() {
  const { user, subscription } = useAuth()
  const { planName, isTrial, hasAdvancedReports } = usePlan()

  const company = (() => {
    try { return JSON.parse(localStorage.getItem('companyData') || '{}') } catch { return {} }
  })()

  const currentPlanKey = planName
  const subStatus = subscription?.status || company?.subscription_status || 'trial'
  const trialEnd = subscription?.trial_ends_at || company?.trial_end_date
  const subEnd = subscription?.current_period_end || company?.subscription_end_date

  const statusLabel = () => {
    if (subStatus === 'active') return { text: 'Active', class: 'bg-green-100 text-green-700' }
    if (subStatus === 'trial') return { text: 'Trial', class: 'bg-blue-100 text-blue-700' }
    if (subStatus === 'expired') return { text: 'Expired', class: 'bg-red-100 text-red-700' }
    if (subStatus === 'suspended') return { text: 'Suspended', class: 'bg-orange-100 text-orange-700' }
    return { text: subStatus, class: 'bg-gray-100 text-gray-600' }
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return null
    return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const status = statusLabel()
  const expiryDate = formatDate(subEnd || trialEnd)

  return (
    <SidebarProvider>
      <AppSidebar userType="client" user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 overflow-hidden">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/client/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Subscription</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto pr-4"><UserMenuDropdown /></div>
        </header>

        <div className="flex flex-col gap-5 p-4 pt-0 pb-24 max-w-3xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Subscription</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Manage your plan and billing</p>
          </div>

          {/* Current Plan Card */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Current Plan</p>
                    <p className="text-lg font-bold text-gray-900 capitalize">
                      {isTrial ? 'Trial' : currentPlanKey === 'laking_negosyo' ? 'Laking Negosyo' : 'Negosyo'}
                    </p>
                  </div>
                </div>
                <Badge className={`${status.class} border-0 text-xs`}>{status.text}</Badge>
              </div>

              {expiryDate && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>
                    {subStatus === 'trial' ? 'Trial ends' : subStatus === 'expired' ? 'Expired' : 'Renews'} on{' '}
                    <strong className="text-gray-700">{expiryDate}</strong>
                  </span>
                </div>
              )}

              {!hasAdvancedReports && (
                <div className="mt-3 flex items-start gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Upgrade to <strong>Laking Negosyo</strong> to unlock Inventory Reports, Financial Reports, and more.</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Plan Comparison */}
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Available Plans</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PLANS.map(plan => {
              const Icon = plan.icon
              const isCurrent = currentPlanKey === plan.key || (isTrial && plan.key === 'negosyo')
              const isUpgrade = plan.key === 'laking_negosyo' && !hasAdvancedReports

              return (
                <Card key={plan.key} className={`border-2 ${isCurrent ? plan.color : 'border-gray-200'} relative`}>
                  {isCurrent && (
                    <div className="absolute -top-3 left-4">
                      <Badge className={`${plan.badgeColor} border-0 text-xs`}>Current Plan</Badge>
                    </div>
                  )}
                  {isUpgrade && (
                    <div className="absolute -top-3 left-4">
                      <Badge className="bg-purple-600 text-white border-0 text-xs">Recommended</Badge>
                    </div>
                  )}
                  <CardContent className="p-5 space-y-3 pt-6">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-bold text-gray-900">{plan.name}</p>
                        <p className="text-xl font-extrabold">
                          {plan.price}<span className="text-sm font-normal text-gray-500">{plan.period}</span>
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-1.5">
                      {plan.perks.map(p => (
                        <li key={p} className="flex items-start gap-2 text-sm text-gray-600">
                          <Check className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                          {p}
                        </li>
                      ))}
                      {plan.key === 'negosyo' && (
                        <li className="flex items-start gap-2 text-sm text-gray-400">
                          <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          Advanced reports (Laking Negosyo only)
                        </li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* How to upgrade */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <p className="font-semibold text-gray-800">How to subscribe / upgrade:</p>
              <ol className="space-y-1.5 text-sm text-gray-600 list-decimal list-inside">
                <li>Send payment via <strong>GCash / Maya / bank transfer</strong></li>
                <li>Message us on Facebook with:
                  <ul className="mt-1 ml-4 space-y-0.5 list-none">
                    <li>• Your <strong>company name</strong></li>
                    <li>• Your <strong>registered email</strong></li>
                    <li>• <strong>Proof of payment</strong> (screenshot)</li>
                    <li>• <strong>Plan</strong> you want (Negosyo / Laking Negosyo)</li>
                  </ul>
                </li>
                <li>We'll activate your account <strong>within the day</strong></li>
              </ol>
              <a href="https://m.me/61578527823519" target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-[#E8302A] hover:bg-[#B91C1C] mt-1">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Message Us on Facebook
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
