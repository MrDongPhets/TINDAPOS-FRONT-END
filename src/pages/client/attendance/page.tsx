import { useState, useEffect, useCallback } from 'react'
import { useApiClient } from '@/hooks/useApiClient'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  SidebarProvider, SidebarInset, SidebarTrigger,
} from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/ui/app-sidebar'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  Clock, Fingerprint, Timer, Users, TrendingUp,
  Search, CalendarDays, Loader2, Filter,
} from 'lucide-react'

type AttendanceRecord = {
  id: string
  staff_id: string
  store_id: string
  clock_in: string
  clock_out: string | null
  total_minutes: number | null
  verified_with_biometric: boolean
  staff: { id: string; name: string; staff_id: string; role: string } | null
}

type SummaryItem = {
  staff: { name: string; staff_id: string; role: string } | null
  total_minutes: number
  shift_count: number
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
}

function roleBadgeClass(role: string) {
  if (role === 'manager') return 'bg-purple-100 text-purple-700'
  if (role === 'supervisor') return 'bg-blue-100 text-blue-700'
  return 'bg-gray-100 text-gray-600'
}

export default function ClientAttendancePage() {
  const { get } = useApiClient()
  const { user, userType, company } = useAuth()

  const [tab, setTab] = useState<'records' | 'summary'>('records')
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [summary, setSummary] = useState<SummaryItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().slice(0, 10)
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10))

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo + 'T23:59:59', limit: '100' })
    const [recRes, sumRes] = await Promise.all([
      get(`/client/attendance?${params}`),
      get(`/client/attendance/summary?${params}`),
    ])
    if (recRes?.success) {
      setRecords(recRes.data?.attendance || [])
      setTotal(recRes.data?.total || 0)
    }
    if (sumRes?.success) {
      setSummary(sumRes.data?.summary || [])
    }
    setLoading(false)
  }, [dateFrom, dateTo])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  const filtered = records.filter(r =>
    !search ||
    r.staff?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.staff?.staff_id?.toLowerCase().includes(search.toLowerCase())
  )

  const totalHours = summary.reduce((a, s) => a + s.total_minutes, 0)
  const activeNow = records.filter(r => !r.clock_out).length

  return (
    <SidebarProvider>
      <AppSidebar userType={userType} user={user} company={company} />
      <SidebarInset>
        <header className="flex items-center gap-2 px-4 py-3 border-b bg-white">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="font-semibold text-gray-900">Staff Attendance</h1>
            <p className="text-xs text-gray-400">Track shift hours and clock-in records</p>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white border rounded-xl p-4">
              <div className="text-xs text-gray-400 mb-1 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Total Records
              </div>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
            <div className="bg-white border rounded-xl p-4">
              <div className="text-xs text-gray-400 mb-1 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> Total Hours
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(totalHours)}</p>
            </div>
            <div className="bg-white border rounded-xl p-4">
              <div className="text-xs text-gray-400 mb-1 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Active Now
              </div>
              <p className="text-2xl font-bold text-green-600">{activeNow}</p>
            </div>
            <div className="bg-white border rounded-xl p-4">
              <div className="text-xs text-gray-400 mb-1 flex items-center gap-1.5">
                <Fingerprint className="h-3.5 w-3.5" /> Biometric
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {records.filter(r => r.verified_with_biometric).length}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-40">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Search staff..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <CalendarDays className="h-3.5 w-3.5" />
              <Input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="h-9 text-sm w-36"
              />
              <span>–</span>
              <Input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="h-9 text-sm w-36"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchRecords}>
              <Filter className="h-3.5 w-3.5 mr-1" /> Apply
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
            {(['records', 'summary'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'records' ? 'All Records' : 'Summary'}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-[#E8302A]" />
            </div>
          ) : tab === 'records' ? (
            <div className="bg-white border rounded-xl overflow-hidden">
              {filtered.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <Clock className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No attendance records found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                        <th className="text-left px-4 py-3">Staff</th>
                        <th className="text-left px-4 py-3">Clock In</th>
                        <th className="text-left px-4 py-3">Clock Out</th>
                        <th className="text-left px-4 py-3">Duration</th>
                        <th className="text-left px-4 py-3">Verified</th>
                        <th className="text-left px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtered.map(r => (
                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{r.staff?.name || '—'}</p>
                            <p className="text-xs text-gray-400">{r.staff?.staff_id}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{formatDateTime(r.clock_in)}</td>
                          <td className="px-4 py-3 text-gray-700">
                            {r.clock_out ? formatTime(r.clock_out) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {r.total_minutes != null ? (
                              <span className="flex items-center gap-1 text-gray-700">
                                <Timer className="h-3.5 w-3.5 text-gray-400" />
                                {formatDuration(r.total_minutes)}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {r.verified_with_biometric
                              ? <Fingerprint className="h-4 w-4 text-blue-500" />
                              : <span className="text-gray-300 text-xs">Manual</span>
                            }
                          </td>
                          <td className="px-4 py-3">
                            {r.clock_out
                              ? <Badge variant="outline" className="text-xs border-gray-200 text-gray-500">Done</Badge>
                              : <Badge className="text-xs bg-green-100 text-green-700 border-0 gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                                  Active
                                </Badge>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* Summary tab */
            <div className="bg-white border rounded-xl overflow-hidden">
              {summary.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No summary data for this period</p>
                </div>
              ) : (
                <div className="divide-y">
                  {summary.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                      <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-gray-600">
                          {item.staff?.name?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {item.staff?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {item.staff?.staff_id} · {item.shift_count} shift{item.shift_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      {item.staff?.role && (
                        <Badge variant="outline" className={`text-xs shrink-0 ${roleBadgeClass(item.staff.role)}`}>
                          {item.staff.role}
                        </Badge>
                      )}
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-gray-900 text-sm">{formatDuration(item.total_minutes)}</p>
                        <p className="text-xs text-gray-400">
                          {(item.total_minutes / 60).toFixed(1)}h total
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
