"use client"

import { useState, useEffect, useRef } from 'react'
import { MapPin, Clock, Package, Truck, BarChart3, History, Navigation, IndianRupee, Star, TrendingUp } from 'lucide-react'
import { DeliveryPerformanceChart } from '@/components/charts/DeliveryPerformanceChart'
import { toast } from '@/components/CustomToaster'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { DeliverySidebar } from '@/components/delivery-sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

interface DeliveryOrder {
  _id: string
  orderNumber: string
  customer: {
    name: string
    phone: string
    address: {
      street: string
      city: string
      state: string
      zipCode: string
    }
  }
  restaurant: {
    name: string
    address: {
      street: string
      city: string
    }
  }
  items: Array<{
    name: string
    quantity: number
  }>
  totalAmount: number
  deliveryFee: number
  status: string
  estimatedDeliveryTime: string
  distance: number
  createdAt: string
  updatedAt?: string
}

export default function DeliveryDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [availableOrders, setAvailableOrders] = useState<DeliveryOrder[]>([])
  const [myOrders, setMyOrders] = useState<DeliveryOrder[]>([])
  const [deliveryHistory, setDeliveryHistory] = useState<DeliveryOrder[]>([])
  // track all unique order IDs that have been exposed in the available list (offer exposures)
  const exposuresRef = useRef<Set<string>>(new Set())
  // Available orders UI controls
  const [availableSearch, setAvailableSearch] = useState('')
  // single sorting (by amount) with direction toggle
  const [amountDesc, setAmountDesc] = useState(true)
  // simplified available orders layout (single full-width list)
  const [userInfo, setUserInfo] = useState<{name: string, email: string} | null>(null)
  const [stats, setStats] = useState({
    todayDeliveries: 0,
    totalDeliveries: 0,
    todayEarnings: 0,
    totalEarnings: 0,
    rating: 0
  })

  useEffect(() => {
    fetchAvailableOrders()
    fetchMyOrders()
    fetchStats()
    fetchUserInfo()
    // Load persisted exposures from previous sessions for overall acceptance rate
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('delivery_exposures')
        if (raw) {
          const arr: string[] = JSON.parse(raw)
          exposuresRef.current = new Set(arr)
        }
      }
    } catch {}
  }, [])

  const fetchUserInfo = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (res.ok) {
        setUserInfo(data.user)
      }
    } catch (error) {
      console.error('Error fetching user info:', error)
    }
  }

  const fetchAvailableOrders = async () => {
    try {
      const res = await fetch('/api/delivery/available-orders')
      const data = await res.json()
      if (res.ok) {
  setAvailableOrders(data.orders)
  // record exposures (unique offers seen)
  data.orders.forEach((o: DeliveryOrder) => exposuresRef.current.add(o._id))
  // persist
  try { if (typeof window !== 'undefined') localStorage.setItem('delivery_exposures', JSON.stringify(Array.from(exposuresRef.current))) } catch {}
      }
    } catch (error) {
      toast.error('Failed to fetch available orders')
    }
  }

  const fetchMyOrders = async () => {
    try {
      const res = await fetch('/api/delivery/my-orders')
      const data = await res.json()
      if (res.ok) {
        // Only show non-delivered orders in My Orders
        const nonDelivered = data.orders.filter((order: DeliveryOrder) => order.status !== 'delivered');
        const delivered = data.orders.filter((order: DeliveryOrder) => order.status === 'delivered');
        setMyOrders(nonDelivered);
        setDeliveryHistory(delivered);
  // Include accepted + delivered orders in exposures for overall denominator
  ;[...nonDelivered, ...delivered].forEach((o: DeliveryOrder) => exposuresRef.current.add(o._id))
  try { if (typeof window !== 'undefined') localStorage.setItem('delivery_exposures', JSON.stringify(Array.from(exposuresRef.current))) } catch {}
  // ...existing code...
      }
    } catch (error) {
      toast.error('Failed to fetch my orders')
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/delivery/stats')
      const data = await res.json()
      if (res.ok) {
        setStats(data.stats)
      }
    } catch (error) {
      toast.error('Failed to fetch stats')
    }
  }

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/delivery/accept-order/${orderId}`, {
        method: 'POST'
      })

      if (res.ok) {
        toast.success('Order accepted successfully!')
        fetchAvailableOrders()
        fetchMyOrders()
      } else {
        toast.error('Failed to accept order')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/delivery/update-status/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (res.ok) {
        toast.success('Order status updated successfully!')
        fetchMyOrders()
      } else {
        toast.error('Failed to update order status')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' })
      if (res.ok) {
        toast.error('Logged out successfully')
        window.location.href = '/'
      } else {
        toast.error('Logout failed')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  // derived helpers
  const totalActiveOrders = myOrders.length
  // Acceptance Rate = Accepted Orders / Total Offers Exposed * 100
  const acceptanceRate = (() => {
    const accepted = myOrders.length + deliveryHistory.length
  let exposures = exposuresRef.current.size || 0
  if (exposures < accepted) exposures = accepted // ensure denominator at least accepted count
  if (exposures === 0) return 0
  return Math.round((accepted / exposures) * 100)
  })()

  const performanceSeries = (() => {
    // Build last 7 day window (local date) and count delivered orders per day
    const fmtLocal = (d: Date) => {
      const y = d.getFullYear()
      const m = String(d.getMonth()+1).padStart(2,'0')
      const day = String(d.getDate()).padStart(2,'0')
      return `${y}-${m}-${day}`
    }
    const today = new Date(); today.setHours(0,0,0,0)
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today); d.setDate(d.getDate() - (6 - i))
      const key = fmtLocal(d) // local yyyy-mm-dd (no UTC shift)
      // Count only orders that are marked 'delivered' and whose delivered date matches the key
      const deliveredOnly = deliveryHistory.filter(o => o.status === 'delivered')
      const deliveredCount = deliveredOnly.filter(o => {
        const dt = new Date(o.updatedAt || o.createdAt)
        const local = new Date(dt); local.setHours(0,0,0,0)
        return fmtLocal(local) === key
      }).length
      return { date: key, delivered: deliveredCount }
    })
  const allZero = days.every(d => d.delivered === 0)
  // NOTE: We intentionally do NOT synthesize non-zero placeholder values here.
  // The chart should reflect actual delivered counts in the 7-day window.
    const max = Math.max(1, ...days.map(d=>d.delivered))
    return { days, max, allZero }
  })()

  // history filters
  const [historySearch, setHistorySearch] = useState('')
  const [historyRange, setHistoryRange] = useState<'7d'|'30d'|'all'>('all')
  const historyFiltered = deliveryHistory.filter(o => {
    const q = historySearch.trim().toLowerCase()
    if (q) {
      const match = o.orderNumber.toLowerCase().includes(q) || o.restaurant?.name?.toLowerCase().includes(q)
      if (!match) return false
    }
    if (historyRange !== 'all') {
      const now = new Date(); now.setHours(0,0,0,0)
      const from = new Date(now)
      if (historyRange === '7d') from.setDate(from.getDate()-6)
      if (historyRange === '30d') from.setDate(from.getDate()-29)
      const dt = new Date(o.updatedAt || o.createdAt)
      return dt >= from && dt <= new Date(now.getTime()+86400000-1)
    }
    return true
  })

  // filtered + sorted available orders (client side visual only)
  const filteredAvailable = availableOrders
    .filter(o => {
      if (!availableSearch.trim()) return true
      const q = availableSearch.toLowerCase()
      return o.orderNumber.toLowerCase().includes(q) || o.restaurant.name.toLowerCase().includes(q)
    })
    .map(o => ({ ...o, totalAmount: Number(o.totalAmount), estimatedEarning: Math.round(Number(o.totalAmount) * 0.3) }))
    .sort((a,b)=> amountDesc ? Number(b.totalAmount) - Number(a.totalAmount) : Number(a.totalAmount) - Number(b.totalAmount))

  if (process.env.NODE_ENV !== 'production') {
    // debug order sequence suppressed
  }

  return (
    <SidebarProvider>
      <DeliverySidebar active={activeTab} onChange={setActiveTab} user={userInfo} onLogout={handleLogout} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4 bg-white/70 dark:bg-gray-950/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-gray-950/60">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block"><BreadcrumbLink>Delivery</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem><BreadcrumbPage>{activeTab === 'my-orders' ? 'My Orders' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto" />
        </header>
  <main className="flex-1 p-4 md:p-6 bg-gradient-to-b from-indigo-50/50 via-background to-background dark:from-gray-900 dark:via-gray-950 dark:to-gray-950 overflow-y-auto delivery-scroll-white">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="flex flex-wrap gap-2 bg-white/60 dark:bg-gray-900/60 p-1 rounded-md border border-indigo-200/60 dark:border-gray-800 shadow-sm backdrop-blur">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'available', label: 'Available', icon: Package },
                { id: 'my-orders', label: 'My Orders', icon: Truck },
                { id: 'history', label: 'History', icon: History }
              ].map(tab => {
                const Icon = tab.icon
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition">
                    <Icon className="h-4 w-4" /> {tab.label}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="space-y-10">
              {/* KPI Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
                <StatCard label="Today's Deliveries"  value={stats.todayDeliveries} accent="from-indigo-50 via-white to-white" iconBg="bg-indigo-500/10 text-indigo-600" Icon={Truck} />
                <StatCard label="Total Deliveries" value={stats.totalDeliveries} accent="from-green-50 via-white to-white" iconBg="bg-green-500/10 text-green-600" Icon={Package} />
                <StatCard label="Today's Earnings" value={stats.todayEarnings} prefix="₹" accent="from-yellow-50 via-white to-white" iconBg="bg-yellow-500/10 text-yellow-600" Icon={IndianRupee} />
                <StatCard label="Total Earnings" value={stats.totalEarnings} prefix="₹" accent="from-rose-50 via-white to-white" iconBg="bg-rose-500/10 text-rose-600" Icon={TrendingUp} />
                <StatCard label="Rating" value={stats.rating} suffix="⭐" accent="from-purple-50 via-white to-white" iconBg="bg-purple-500/10 text-purple-600" Icon={Star} />
              </div>

              <div className="grid gap-6 2xl:gap-8 xl:grid-cols-7">
                {/* Performance Chart */}
                <Card className="xl:col-span-4 border-indigo-100/70 dark:border-gray-800/70 shadow-sm bg-white/70 dark:bg-gray-950/40 backdrop-blur">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold tracking-wide flex items-center gap-2"><BarChart3 className="h-4 w-4 text-indigo-600" /> 7 Day Performance</CardTitle>
                    <span className="text-[11px] text-muted-foreground font-medium">Deliveries Trend</span>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <DeliveryPerformanceChart data={performanceSeries.days} />
                    <div className="grid grid-cols-3 gap-4 mt-4 text-[11px] font-medium text-muted-foreground">
                      <div className="flex flex-col gap-0.5"><span>Total (7d)</span><span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{performanceSeries.days.reduce((a,b)=>a+b.delivered,0)}</span></div>
                      <div className="flex flex-col gap-0.5"><span>Avg / Day</span><span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{(performanceSeries.days.reduce((a,b)=>a+b.delivered,0)/performanceSeries.days.length).toFixed(1)}</span></div>
                      <div className="flex flex-col gap-0.5"><span>Best Day</span><span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{Math.max(...performanceSeries.days.map(d=>d.delivered))}</span></div>
                    </div>
                    {performanceSeries.allZero && stats.totalDeliveries === 0 && (
                      <p className="mt-3 text-[10px] text-muted-foreground">No delivered orders yet — start completing deliveries to see real performance data.</p>
                    )}
                    {performanceSeries.allZero && stats.totalDeliveries > 0 && deliveryHistory.length === 0 && (
                      <p className="mt-3 text-[10px] text-indigo-600/80 dark:text-indigo-300/80">You have deliveries in your account but no dated delivery history available for the 7 day window.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Efficiency / Stats Column  */}
                <div className="xl:col-span-3">
                  <Card className="border-indigo-100/70 dark:border-gray-800/70 shadow-sm bg-white/70 dark:bg-gray-950/40 backdrop-blur">
                    <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold tracking-wide flex items-center gap-2">Efficiency & Health</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-5 gap-6">
                      <div className="md:col-span-3 space-y-4">
                        <ProgressStat label="Acceptance Rate" value={acceptanceRate} color="indigo" />
                        <ProgressStat label="Active Orders" value={totalActiveOrders} max={15} color="green" />
                        <ProgressStat label="Avg Earn / Order" value={Math.round(stats.totalEarnings / (stats.totalDeliveries || 1))} max={500} color="yellow" unit="₹" />
                      </div>
                      <div className="md:col-span-2 flex flex-col gap-4">
                        <div className="flex-1 rounded-lg border border-indigo-100/60 dark:border-gray-800/70 bg-gradient-to-br from-indigo-50/70 via-white to-white dark:from-indigo-950/20 dark:via-gray-950 dark:to-gray-950 p-4 flex flex-col justify-between">
                          <div className="text-[11px] font-medium text-indigo-600 dark:text-indigo-300 mb-1">Acceptance</div>
                          <div className="text-3xl font-bold tabular-nums leading-none">{acceptanceRate.toFixed(0)}%</div>
                          <div className="mt-3 h-2 w-full rounded-full bg-indigo-100 dark:bg-indigo-900/40 overflow-hidden">
                            <div className="h-full bg-indigo-600" style={{width: `${acceptanceRate}%`}} />
                          </div>
                        </div>
                        <div className="flex-1 rounded-lg border border-purple-100/60 dark:border-gray-800/70 bg-gradient-to-br from-purple-50/70 via-white to-white dark:from-purple-950/20 dark:via-gray-950 dark:to-gray-950 p-4 flex flex-col justify-between">
                          <div className="text-[11px] font-medium text-purple-600 dark:text-purple-300 mb-1">Rating</div>
                          <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold leading-none tabular-nums">{stats.rating.toFixed(1)}</span>
                            <span className="text-sm text-muted-foreground pb-1">/ 5</span>
                          </div>
                          <div className="mt-2 flex gap-1">
                            {[1,2,3,4,5].map(i => (
                              <svg key={i} className={`h-4 w-4 ${i <= Math.round(stats.rating) ? 'text-purple-500' : 'text-gray-300 dark:text-gray-700'}`} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.034a1 1 0 00-1.175 0l-2.802 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Earnings & Activity */}
              <div className="grid gap-6 2xl:gap-8 xl:grid-cols-7">
                
                <Card className="xl:col-span-4 border-indigo-100/70 dark:border-gray-800/70 shadow-sm bg-white/70 dark:bg-gray-950/40 backdrop-blur">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold tracking-wide">Recent Activity</CardTitle></CardHeader>
                  <CardContent className="max-h-72 overflow-auto pr-2 delivery-scroll-white">
                    <ul className="space-y-4 text-xs">
                      {([...myOrders, ...deliveryHistory]
                        .sort((a,b)=> new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())
                        .slice(0,4)
                      ).map(o => {
                        const dt = new Date(o.createdAt)
                        const datePart = dt.toLocaleDateString([], { day:'2-digit', month:'short' })
                        const timePart = dt.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
                        return (
                          <li key={o._id} className="flex items-start gap-3 group">
                            <div className="relative mt-0.5">
                              <span className={`h-2.5 w-2.5 rounded-full block ${o.status==='delivered'?'bg-green-500':'bg-indigo-500'} ring-2 ring-white dark:ring-gray-950`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 dark:text-gray-200 truncate">Order #{o.orderNumber} <span className="ml-1 font-normal text-muted-foreground">{o.status.replace(/-/g,' ')}</span></p>
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1">{datePart},{timePart} · ₹{o.totalAmount}</p>
                            </div>
                            <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] opacity-0 group-hover:opacity-100 transition border-indigo-200 hover:bg-indigo-50 hover:text-black" onClick={()=>setActiveTab(o.status==='delivered'?'history':'my-orders')}>View</Button>
                          </li>
                        )
                      })}
                      {myOrders.length + deliveryHistory.length === 0 && (
                        <li className="text-muted-foreground text-[11px]">No activity yet.</li>
                      )}
                    </ul>
                    {(myOrders.length + deliveryHistory.length) > 4 && (
                      <div className="mt-4 pt-2 border-t flex justify-center">
                        <button
                          onClick={()=>setActiveTab('history')}
                          className="px-3 h-7 text-[11px] font-medium rounded-md border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-600 dark:bg-gray-900 dark:hover:bg-gray-800 dark:border-indigo-800 transition"
                        >
                          View All →
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Available Orders (attractive layout) */}
            <TabsContent value="available" className="space-y-6">
              <Card className="border-indigo-100/70 dark:border-gray-800/70 shadow-sm rounded-none">
                <CardHeader className="pb-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">Available Orders <span className="text-[11px] font-normal text-muted-foreground">{filteredAvailable.length} shown</span></CardTitle>
                    <p className="text-[11px] text-muted-foreground">Claim high earning orders quickly. Refresh for latest.</p>
                  </div>
                  <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <div className="relative">
                      <Input value={availableSearch} onChange={e=>setAvailableSearch(e.target.value)} placeholder="Search # or restaurant..." className="pl-8 h-9 w-60 border-indigo-300 focus-visible:ring-indigo-500" />
                      <svg className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </div>
                    <button onClick={()=>setAmountDesc(d=>!d)} className="px-3 h-9 inline-flex items-center gap-1 rounded-md border bg-white dark:bg-gray-900 text-[11px] font-medium text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">
                      Amount
                      <svg className={`h-3.5 w-3.5 transition ${amountDesc ? '' : 'rotate-180'}`} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <Button size="sm" variant="outline" className="h-9 px-3 hover:bg-indigo-600" onClick={fetchAvailableOrders}>Refresh</Button>
                    {(availableSearch || !amountDesc) && (
                      <button onClick={()=>{setAvailableSearch(''); setAmountDesc(true)}} className="h-9 px-3 rounded-md border bg-white dark:bg-gray-900 text-[11px] text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">Clear</button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-6">
                  {availableOrders.length === 0 && (
                    <div className="text-xs text-muted-foreground border border-dashed rounded-md p-8 text-center">No available orders right now.</div>
                  )}
                  {availableOrders.length > 0 && filteredAvailable.length === 0 && (
                    <div className="text-xs text-muted-foreground border border-dashed rounded-md p-8 text-center">No orders match your filters.</div>
                  )}
                  {filteredAvailable.length > 0 && (
                    <div className="space-y-4">
                      {filteredAvailable.map(order => {
                        const created = new Date(order.createdAt)
                        const createdTime = created.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})
                        const createdDate = created.toLocaleDateString([], {day:'2-digit', month:'short'})
                        return (
                          <div key={order._id} className="border rounded-none bg-white dark:bg-gray-950 border-indigo-100/70 dark:border-gray-800/70 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition">
                            <div className="flex flex-col md:flex-row md:items-stretch">
                              {/* Left main info */}
                              <div className="flex-1 p-3 flex flex-col gap-3">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="flex flex-col gap-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[13px] font-semibold text-indigo-600">#{order.orderNumber}</span>
                                      <span className="px-2 py-0.5 rounded-sm bg-indigo-600 text-[12px]  text-white border  dark:border-indigo-800">₹{order.estimatedEarning}</span>
                                    </div>
                                    <div className="text-[11px] text-muted-foreground truncate">{order.restaurant.name}</div>
                                  </div>
                                  <div className="text-right text-[11px] font-medium leading-tight">
                                    <div className="text-sm font-bold tabular-nums text-gray-800 dark:text-gray-100">₹{order.totalAmount}</div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5">{createdDate} {createdTime}</div>
                                  </div>
                                </div>
                                <div className="flex flex-col md:flex-row gap-3 text-[10px]">
                                  <div className="flex-1 min-w-0 p-2 rounded-sm border bg-white dark:bg-gray-900 flex flex-col gap-1">
                                    <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 uppercase"><MapPin className="h-3 w-3" /> Pickup</div>
                                    <p className="text-[11px] text-muted-foreground leading-snug truncate" title={`${order.restaurant.address.street}, ${order.restaurant.address.city}`}>{order.restaurant.address.street}, {order.restaurant.address.city}</p>
                                  </div>
                                  <div className="hidden md:flex w-10 items-center justify-center">
                                    <div className="h-0.5 w-full bg-gradient-to-r from-indigo-400 via-indigo-300 to-indigo-200 dark:from-indigo-700 dark:via-indigo-600 dark:to-indigo-500 rounded-full" />
                                  </div>
                                  <div className="flex-1 min-w-0 p-2 rounded-sm border bg-white dark:bg-gray-900 flex flex-col gap-1">
                                    <div className="flex items-center gap-1 text-[10px] font-semibold text-green-600 uppercase"><MapPin className="h-3 w-3" /> Drop</div>
                                    <p className="text-[11px] text-muted-foreground leading-snug truncate" title={order.customer.address?.street && order.customer.address?.city ? `${order.customer.address.street}, ${order.customer.address.city}` : 'Address not provided'}>{order.customer.address?.street && order.customer.address?.city ? `${order.customer.address.street}, ${order.customer.address.city}` : 'Address not provided'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2 rounded-sm border bg-white dark:bg-gray-900 px-2 py-1.5 flex-1 min-w-0">
                                    <div className="flex-1 leading-snug text-[10px] text-gray-600 dark:text-gray-300 truncate" title={order.items.map(i=>`${i.quantity}x ${i.name}`).join(', ')}>
                                      {order.items.slice(0,4).map((it,i)=>(<span key={i}>{it.quantity}x {it.name}{i<Math.min(order.items.length,4)-1 && ', '}</span>))}
                                      {order.items.length>4 && <span> +{order.items.length-4}</span>}
                                    </div>
                                    <span className="px-1.5 py-0.5 rounded-sm border bg-indigo-50 text-indigo-600 border-indigo-200 text-[9px] font-medium dark:bg-indigo-900/30 dark:border-indigo-800">{order.items.length}</span>
                                  </div>
                                  
                                </div>
                              </div>
                              {/* Accept side (on md) */}
                              <div className="md:w-40 border-t md:border-t-0 md:border-l flex items-center justify-center bg-indigo-50/40 dark:bg-indigo-950/20 p-3">
                                <button onClick={()=>handleAcceptOrder(order._id)} className="w-full h-10 text-[11px] font-medium tracking-wide bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center justify-center gap-2 rounded-sm">
                                  Accept
                                  <svg className="h-3.5 w-3.5 opacity-80 group-hover:translate-x-0.5 transition" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                </button>
                              </div>
                            </div>
                            {/* Mobile accept full width */}
                            <div className="md:hidden border-t">
                              <button onClick={()=>handleAcceptOrder(order._id)} className="w-full h-9 text-[11px] font-medium tracking-wide bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                                Accept Order
                                <svg className="h-3.5 w-3.5 opacity-80 group-hover:translate-x-0.5 transition" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* My Orders (revamped) */}
            <TabsContent value="my-orders" className="space-y-6">
              {myOrders.length === 0 ? (
                <div className="text-xs text-muted-foreground border border-dashed rounded-md p-8 text-center">You have no active orders.</div>
              ) : (
                <div className="space-y-4">
                  {myOrders.map(order => {
                    const estimatedEarning = Math.round(order.totalAmount * 0.3)
                    const steps = ['confirmed','picked-up','out-for-delivery','delivered']
                    const currentIndex = steps.indexOf(order.status)
                    return (
                      <Card key={order._id} className="border-indigo-100/70 dark:border-gray-800/70 shadow-sm overflow-hidden rounded-none">
                        <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                          <div className="space-y-1">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">#{order.orderNumber} <StatusBadge status={order.status} /></CardTitle>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">{order.customer.name} · {order.customer.phone}</p>
                          </div>
                          <div className="text-right text-xs font-medium min-w-[88px]">
                            <div className="font-semibold tabular-nums text-gray-800 dark:text-gray-200">₹{order.totalAmount}</div>
                            <div className="text-[10px] text-green-600 dark:text-green-400">Earn ~₹{estimatedEarning}</div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-4 text-xs">
                          <div className="flex flex-col gap-2">
                            <OrderProgress steps={steps} current={currentIndex} />
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="bg-white dark:bg-gray-900 border-indigo-200/60 text-indigo-600">Items {order.items.length}</Badge>
                              <Badge variant="outline" className="bg-white dark:bg-gray-900">Created {new Date(order.createdAt).toLocaleDateString([], {day:'2-digit', month:'short'})} {new Date(order.createdAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</Badge>
                            </div>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="p-2 rounded-md border bg-white dark:bg-gray-900 flex flex-col gap-1">
                              <span className="text-[10px] font-medium text-indigo-600">Customer Address</span>
                              <p className="text-[11px] text-muted-foreground leading-snug">{order.customer.address?.street && order.customer.address?.city ? `${order.customer.address.street}, ${order.customer.address.city}` : 'Not available'}</p>
                            </div>
                            <div className="p-2 rounded-md border bg-white dark:bg-gray-900 flex flex-col gap-1">
                              <span className="text-[10px] font-medium text-indigo-600">Items</span>
                              <div className="text-[11px] text-muted-foreground leading-snug">
                                {order.items.slice(0,4).map((it,i)=> <span key={i}>{it.quantity}x {it.name}{i < Math.min(order.items.length,4)-1 && ', '}</span>)}
                                {order.items.length>4 && <span> +{order.items.length-4} more</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap justify-end gap-2">
                            {order.status === 'confirmed' && (
                              <Button size="sm" variant="outline" className="h-8 px-3 border-yellow-300 text-yellow-700 hover:bg-yellow-50" onClick={()=>handleUpdateOrderStatus(order._id,'picked-up')}>Picked Up</Button>
                            )}
                            {order.status === 'picked-up' && (
                              <Button size="sm" variant="outline" className="h-8 px-3 border-blue-300 text-blue-700 hover:bg-blue-50" onClick={()=>handleUpdateOrderStatus(order._id,'out-for-delivery')}>Out For Delivery</Button>
                            )}
                            {order.status === 'out-for-delivery' && (
                              <Button size="sm" className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white" onClick={()=>handleUpdateOrderStatus(order._id,'delivered')}>Delivered</Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            {/* History (simplified with search & filters) */}
            <TabsContent value="history" className="space-y-6">
              {deliveryHistory.length === 0 ? (
                <div className="text-xs text-muted-foreground border border-dashed rounded-md p-8 text-center">No delivered orders yet.</div>
              ) : (
                <Card className="border-indigo-100/70 dark:border-gray-800/70 shadow-sm rounded-none">
                  <CardHeader className="pb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">Delivered Orders <span className="text-[11px] font-normal text-muted-foreground">({historyFiltered.length}/{deliveryHistory.length})</span></CardTitle>
                      <p className="text-[10px] text-muted-foreground">Search & filter your completed deliveries.</p>
                    </div>
                    <div className="flex flex-wrap gap-3 items-center">
                      <div className="relative">
                        <Input value={historySearch} onChange={e=>setHistorySearch(e.target.value)} placeholder="Search # or restaurant..." className="pl-7 h-9 w-56 border-indigo-300 focus-visible:ring-indigo-500" />
                        <svg className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                      </div>
                      <div className="inline-flex rounded-md overflow-hidden border bg-white dark:bg-gray-900">
                        {(['7d','30d','all'] as const).map(r => (
                          <button key={r} onClick={()=>setHistoryRange(r)} className={`px-3 h-9 text-[11px] font-medium uppercase tracking-wide transition ${historyRange===r ? 'bg-indigo-600 text-white':'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{r}</button>
                        ))}
                      </div>
                      {(historySearch || historyRange!=='all') && (
                        <button onClick={()=>{setHistorySearch(''); setHistoryRange('all')}} className="h-9 px-3 rounded-md border bg-white dark:bg-gray-900 text-[11px] text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">Clear</button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="rounded-md border overflow-auto max-h-[70vh] delivery-scroll-white">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900 z-10">
                          <tr className="text-left">
                            <th className="py-2 px-3 font-medium">Order #</th>
                            <th className="py-2 px-3 font-medium">Time</th>
                            <th className="py-2 px-3 font-medium">Items</th>
                            <th className="py-2 px-3 font-medium text-right">Total</th>
                            <th className="py-2 px-3 font-medium text-right">Earned</th>
                            <th className="py-2 px-3 font-medium text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historyFiltered.map(order => {
                            const earning = Math.round(order.totalAmount * 0.3)
                            const dateObj = new Date(order.updatedAt || order.createdAt)
                            return (
                              <tr key={order._id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-900/40">
                                <td className="py-2 px-3 font-semibold text-indigo-600">#{order.orderNumber}</td>
                                <td className="py-2 px-3 text-muted-foreground">{dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                                <td className="py-2 px-3 text-muted-foreground">{order.items.slice(0,3).map((it,i)=>(<span key={i}>{it.quantity}x {it.name}{i < Math.min(order.items.length,3)-1 && ', '}</span>))}{order.items.length>3 && <span> +{order.items.length-3}</span>}</td>
                                <td className="py-2 px-3 text-right tabular-nums font-medium">₹{order.totalAmount}</td>
                                <td className="py-2 px-3 text-right tabular-nums font-semibold text-green-600">₹{earning}</td>
                                <td className="py-2 px-3 text-right"><Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Delivered</Badge></td>
                              </tr>
                            )
                          })}
                          {historyFiltered.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-muted-foreground text-[11px]">No delivered orders match your filters.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

// --- UI helpers reused (mini) ---
const StatCard = ({ label, value, prefix='', suffix='', accent='from-indigo-50 via-white to-white', iconBg='bg-indigo-500/10 text-indigo-600', Icon = Truck }: { label: string; value: number; prefix?: string; suffix?: string; accent?: string; iconBg?: string; Icon?: any }) => {
  return (
    <Card className={`relative overflow-hidden border border-indigo-100/70 dark:border-gray-800/70 shadow-sm bg-gradient-to-br ${accent}`}>
      <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">{label}</CardTitle>
          <div className="mt-2 text-2xl font-bold tabular-nums">{prefix}{value.toLocaleString()}{suffix}</div>
        </div>
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${iconBg} ring-1 ring-current/10 backdrop-blur-sm`}>            
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
    </Card>
  )
}

const ProgressStat = ({ label, value, max=100, color='indigo', unit='' }: { label: string; value: number; max?: number; color?: string; unit?: string }) => {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const barColor = {
    indigo: 'from-indigo-400 via-indigo-500 to-indigo-600',
    green: 'from-green-400 via-green-500 to-green-600',
    yellow: 'from-yellow-400 via-yellow-500 to-yellow-600'
  }[color] || 'from-indigo-400 via-indigo-500 to-indigo-600'
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <span className="text-[11px] font-semibold tabular-nums text-gray-700 dark:text-gray-300">{unit}{value} ({pct}%)</span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
        <div className={`h-full bg-gradient-to-r ${barColor}`} style={{ width: pct + '%' }} />
      </div>
    </div>
  )
}

const StatusBadge = ({ status }: { status: string }) => {
  const mapping: Record<string, string> = {
    delivered: 'bg-green-100 text-green-700 border-green-200',
    'out-for-delivery': 'bg-blue-100 text-blue-700 border-blue-200',
    'picked-up': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    confirmed: 'bg-indigo-100 text-indigo-700 border-indigo-200'
  }
  return <Badge variant="outline" className={mapping[status] || 'bg-gray-100 text-gray-700 border-gray-200'}>{status.replace(/-/g,' ')}</Badge>
}

// Horizontal step progress for My Orders
const OrderProgress = ({ steps, current }: { steps: string[]; current: number }) => {
  return (
    <div className="w-full flex items-center gap-2">
      {steps.map((s,i)=> {
        const active = i <= current
        return (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div className={`h-6 px-2 rounded-md text-[10px] font-medium flex items-center justify-center border transition ${active ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm':'bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-800'}`}>{s.replace(/-/g,' ')}</div>
            {i < steps.length-1 && (
              <div className={`flex-1 h-1 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800`}>
                <div className={`h-full ${i < current ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-700'} transition-all`} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
 