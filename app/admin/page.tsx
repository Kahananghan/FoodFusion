'use client'

import { useState, useEffect, useRef } from 'react'
import { Users, Store, Truck, ShoppingBag, CheckCircle, XCircle, Eye, Search, BarChart3, TrendingUp, Clock, MapPin, IndianRupee, ArrowUpDown, ChevronUp, ChevronDown, EyeOff } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import toast from 'react-hot-toast'
import './admin.css'

interface User {
  _id: string
  name: string
  email: string
  role: string
  createdAt: string
  isActive: boolean
  lastLogin?: string
  totalOrders?: number
}

interface Restaurant {
  _id: string
  name: string
  owner: { name: string; email: string }
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  cuisine?: string
  rating?: number
  totalOrders?: number
  revenue?: number
}

interface Order {
  _id: string
  orderNumber: string
  customer: { name: string; email: string }
  restaurant: { name: string }
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out-for-delivery' | 'delivered' | 'cancelled'
  total: number
  createdAt: string
  deliveryPartner?: { name: string }
}

interface DeliveryPartner {
  _id: string
  name: string
  email: string
  phone: string
  status: 'available' | 'busy' | 'offline'
  rating: number
  totalDeliveries: number
  earnings: number
  location?: { lat: number; lng: number }
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState({ stats: false, users: false, restaurants: false, orders: false, partners: false })
  // sorting state per table
  type SortState = { key: string; direction: 'asc' | 'desc' }
  const [userSort, setUserSort] = useState<SortState>({ key: 'createdAt', direction: 'desc' })
  const [restaurantSort, setRestaurantSort] = useState<SortState>({ key: 'createdAt', direction: 'desc' })
  const [orderSort, setOrderSort] = useState<SortState>({ key: 'createdAt', direction: 'desc' })
  const [partnerSort, setPartnerSort] = useState<SortState>({ key: 'totalDeliveries', direction: 'desc' })
  // pagination states
  const [pageSize, setPageSize] = useState(10)
  const [userPage, setUserPage] = useState(1)
  const [restaurantPage, setRestaurantPage] = useState(1)
  const [orderPage, setOrderPage] = useState(1)
  const [partnerPage, setPartnerPage] = useState(1)
  const [users, setUsers] = useState<User[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [userInfo, setUserInfo] = useState<{name: string, email: string} | null>(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRestaurants: 0,
    totalOrders: 0,
    pendingApprovals: 0,
    activeDeliveryPartners: 0,
    avgOrderValue: 0,
    completionRate: 0,
    totalRevenue: 0 // will always be recalculated from deliveryPartners
  })

  useEffect(() => {
    fetchStats()
    fetchUsers()
    fetchRestaurants()
    fetchOrders()
    fetchDeliveryPartners()
    fetchUserInfo()
  }, [])

  // reset status filter when switching primary entity tabs
  useEffect(() => {
    setFilterStatus('all')
    setUserPage(1); setRestaurantPage(1); setOrderPage(1); setPartnerPage(1)
  }, [activeTab])

  // reset page when search/filter/pageSize changes
  useEffect(() => { setUserPage(1); setRestaurantPage(1); setOrderPage(1); setPartnerPage(1) }, [searchTerm, filterStatus, pageSize])

  const clampPage = (page: number, total: number) => Math.min(Math.max(1, page), Math.max(1, total))

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

  const fetchStats = async () => {
    setLoading(l => ({ ...l, stats: true }))
    try {
      const res = await fetch('/api/admin/stats')
      const data = await res.json()
      if (res.ok) {
        // Exclude avgOrderValue so our client-side computed value (from orders) is not overwritten
        const { avgOrderValue: _ignoreAvg, ...rest } = data.stats || {}
        setStats(prev => ({
          ...prev,
          ...rest,
          totalRevenue: prev.totalRevenue, // keep previously aggregated revenue
          avgOrderValue: prev.avgOrderValue // preserve client-computed average
        }))
      }
    } catch (error) {
      toast.error('Failed to fetch stats')
    } finally {
      setLoading(l => ({ ...l, stats: false }))
    }
  }

  const fetchUsers = async () => {
    setLoading(l => ({ ...l, users: true }))
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (res.ok) {
        setUsers(data.users)
      }
    } catch (error) {
      toast.error('Failed to fetch users')
    } finally {
      setLoading(l => ({ ...l, users: false }))
    }
  }

  const fetchRestaurants = async () => {
    setLoading(l => ({ ...l, restaurants: true }))
    try {
      const res = await fetch('/api/admin/restaurants')
      const data = await res.json()
      if (res.ok) {
        setRestaurants(data.restaurants)
      }
    } catch (error) {
      toast.error('Failed to fetch restaurants')
    } finally {
      setLoading(l => ({ ...l, restaurants: false }))
    }
  }

  const fetchOrders = async () => {
    setLoading(l => ({ ...l, orders: true }))
    try {
      const res = await fetch('/api/admin/orders')
      const data = await res.json()
      if (res.ok) {
        const fetched = data.orders || []
        setOrders(fetched)
        // Compute average order value client-side (all orders). Adjust filter if only delivered orders are desired.
        if (fetched.length) {
          const sum = fetched.reduce((acc: number, o: any) => acc + (Number(o.total) || 0), 0)
          const avg = sum / fetched.length
          setStats(prev => ({ ...prev, avgOrderValue: Math.round(avg) }))
        } else {
          setStats(prev => ({ ...prev, avgOrderValue: 0 }))
        }
      }
    } catch (error) {
      console.error('Orders fetch error:', error)
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(l => ({ ...l, orders: false }))
    }
  }

  const fetchDeliveryPartners = async () => {
    setLoading(l => ({ ...l, partners: true }))
    try {
      const res = await fetch('/api/admin/delivery-partners')
      const data = await res.json()
      if (res.ok) {
        setDeliveryPartners(data.partners)
        const totalRevenue = data.partners.reduce((sum: number, partner: any) => sum + (partner.earnings || 0), 0)
        setStats(prev => ({ ...prev, totalRevenue }))
      }
    } catch (error) {
      toast.error('Failed to fetch delivery partners')
    } finally {
      setLoading(l => ({ ...l, partners: false }))
    }
  }

  const handleUserStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (res.ok) {
        toast.success('User status updated successfully!')
        fetchUsers()
      } else {
        toast.error('Failed to update user status')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleRestaurantApproval = async (restaurantId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/admin/restaurants/${restaurantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (res.ok) {
        toast.success(`Restaurant ${status} successfully!`)
        fetchRestaurants()
        fetchStats()
      } else {
        toast.error('Failed to update restaurant status')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleOrderStatusUpdate = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (res.ok) {
        toast.success('Order status updated successfully!')
        fetchOrders()
        fetchStats()
      } else {
        toast.error('Failed to update order status')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handlePartnerStatusToggle = async (partnerId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/delivery-partners/${partnerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (res.ok) {
        toast.success('Partner status updated successfully!')
        fetchDeliveryPartners()
      } else {
        toast.error('Failed to update partner status')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.owner.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredPartners = deliveryPartners.filter(partner =>
    partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // generic sort helper
  const compareValues = (a: any, b: any) => {
    if (a == null && b == null) return 0
    if (a == null) return -1
    if (b == null) return 1
    // date detection
    if (typeof a === 'string' && /\d{4}-\d{2}-\d{2}T/.test(a)) {
      const da = new Date(a).getTime(); const db = new Date(b).getTime();
      return da === db ? 0 : da < db ? -1 : 1
    }
    if (typeof a === 'number' && typeof b === 'number') return a === b ? 0 : a < b ? -1 : 1
    // boolean
    if (typeof a === 'boolean' && typeof b === 'boolean') return a === b ? 0 : a ? 1 : -1
    // fallback string compare (case-insensitive)
    return String(a).localeCompare(String(b), undefined, { sensitivity: 'accent', numeric: true })
  }

  // allow dot notation for nested props
  const deepGet = (obj: any, path: string) => path.split('.').reduce((acc, part) => acc?.[part], obj)
  const sortArray = <T,>(data: T[], key: string, direction: 'asc' | 'desc'): T[] => {
    if (!key) return data
    return [...data].sort((a: any, b: any) => {
      const av = key.includes('.') ? deepGet(a, key) : a[key]
      const bv = key.includes('.') ? deepGet(b, key) : b[key]
      const result = compareValues(av, bv)
      return direction === 'asc' ? result : -result
    })
  }

  const sortedUsers = sortArray(filteredUsers, userSort.key, userSort.direction)
  const sortedRestaurants = sortArray(filteredRestaurants, restaurantSort.key, restaurantSort.direction)
  const sortedOrders = sortArray(filteredOrders, orderSort.key, orderSort.direction)
  // partners special earnings derived fallback
  const partnersWithDerived = filteredPartners.map(p => ({
    ...p,
    computedEarnings: (p.earnings !== undefined && p.earnings !== null) ? p.earnings : (p.totalDeliveries && stats.avgOrderValue ? p.totalDeliveries * stats.avgOrderValue * 0.3 : 0)
  }))
  const sortedPartners = sortArray(partnersWithDerived as any[], partnerSort.key, partnerSort.direction)

  const nextSort = (current: SortState, key: string): SortState => (
    current.key === key
      ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      : { key, direction: 'asc' }
  )

  const SortButton = ({
    active,
    direction,
    children,
    onClick
  }: { active: boolean; direction: 'asc' | 'desc'; children: React.ReactNode; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex items-center gap-1 font-semibold uppercase tracking-wide text-[11px] text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400"
      aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {children}
      {active ? (
        direction === 'asc' ? <ChevronUp className="h-3 w-3 text-orange-600" /> : <ChevronDown className="h-3 w-3 text-orange-600" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-60" />
      )}
    </button>
  )

  // pagination helpers
  const paginate = <T,>(data: T[], page: number, size: number) => {
    const totalPages = Math.ceil(data.length / size) || 1
    const current = clampPage(page, totalPages)
    const start = (current - 1) * size
    return { slice: data.slice(start, start + size), totalPages, current, total: data.length }
  }
  const userPaginated = paginate(sortedUsers, userPage, pageSize)
  const restaurantPaginated = paginate(sortedRestaurants, restaurantPage, pageSize)
  const orderPaginated = paginate(sortedOrders, orderPage, pageSize)
  const partnerPaginated = paginate(sortedPartners, partnerPage, pageSize)

  const PageControls = ({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) => {
    if (totalPages <= 1) return null
    const pages: (number | '…')[] = []
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p)
      else if (pages[pages.length - 1] !== '…') pages.push('…')
    }
    return (
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-3 py-3 border-t bg-gray-50/60 dark:bg-gray-800/40">
        <div className="text-xs text-muted-foreground">Page {page} of {totalPages}</div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" className="h-8 px-2" disabled={page === 1} onClick={() => onChange(page - 1)}>Prev</Button>
          {pages.map((p, i) => p === '…' ? (
            <span key={i} className="px-2 text-xs text-muted-foreground">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`h-8 min-w-8 px-2 rounded-md text-xs font-medium border transition ${p === page ? 'bg-orange-600 text-white border-orange-600' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-gray-800'}`}
            >{p}</button>
          ))}
          <Button size="sm" variant="outline" className="h-8 px-2" disabled={page === totalPages} onClick={() => onChange(page + 1)}>Next</Button>
        </div>
      </div>
    )
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

  // helper components -------------------------------------------------------
  const StatusBadge = ({ children, color }: { children: React.ReactNode; color: string }) => (
    <Badge
      variant="outline"
      className={
        {
          green: 'bg-green-100 text-green-700 border-green-200',
          red: 'bg-red-100 text-red-700 border-red-200',
          yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          blue: 'bg-blue-100 text-blue-700 border-blue-200',
          purple: 'bg-purple-100 text-purple-700 border-purple-200',
          indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
          gray: 'bg-gray-100 text-gray-700 border-gray-200'
        }[color] || ''
      }
    >
      {children}
    </Badge>
  )

  const SearchBar = ({ placeholder }: { placeholder: string }) => (
    <div className="relative w-full md:w-64">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-9"
      />
    </div>
  )

  const StatusSelect = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )

  // -------------------- UI Enhancement Helpers (Overview) --------------------
  const useCountUp = (value: number, duration = 900) => {
    const [display, setDisplay] = useState(0)
    useEffect(() => {
      let frame: number
      const start = performance.now()
      const animate = (t: number) => {
        const progress = Math.min(1, (t - start) / duration)
        setDisplay(Math.round(value * progress))
        if (progress < 1) frame = requestAnimationFrame(animate)
      }
      frame = requestAnimationFrame(animate)
      return () => cancelAnimationFrame(frame)
    }, [value, duration])
    return display
  }

  const StatCard = ({
    label,
    icon: Icon,
    value,
    suffix = '',
    trend = '+0%',
    accent = 'from-orange-100 via-white to-white',
    iconBg = 'bg-orange-500/10 text-orange-600'
  }: {
    label: string
    icon: any
    value: number
    suffix?: string
    trend?: string
    accent?: string
    iconBg?: string
  }) => {
    const animated = useCountUp(value)
    const positive = trend.trim().startsWith('+')
    return (
      <Card className={`relative overflow-hidden border border-gray-200/70 dark:border-gray-800/70 shadow-sm group transition hover:shadow-md bg-gradient-to-br ${accent}`}>        
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-[radial-gradient(circle_at_80%_0%,rgba(251,146,60,0.25),transparent_60%)]" />
        <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">{label}</CardTitle>
            <div className="mt-2 text-2xl font-bold tabular-nums">{animated.toLocaleString()}{suffix}</div>
          </div>
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${iconBg} ring-1 ring-current/10 backdrop-blur-sm`}>            
            <Icon className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className={`text-[11px] font-medium flex items-center gap-1 ${positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>            
            <TrendingUp className={`h-3 w-3 ${positive ? '' : 'rotate-180'}`} /> {trend} <span className="text-gray-400">vs last month</span>
          </p>
        </CardContent>
      </Card>
    )
  }

  const ProgressStat = ({ label, value, color = 'orange' }: { label: string; value: number; color?: string }) => {
    const clamped = Math.min(100, Math.max(0, value))
    const barColor = {
      orange: 'bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600',
      green: 'bg-gradient-to-r from-green-400 via-green-500 to-green-600',
      purple: 'bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600',
      blue: 'bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600'
    }[color] || 'bg-orange-500'
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
          <span className="text-xs font-semibold tabular-nums text-gray-700 dark:text-gray-300">{clamped.toFixed(0)}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
          <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: clamped + '%' }} />
        </div>
      </div>
    )
  }

  // -------------------- Simple Inline Chart Data (Last 7 Days) --------------------
  // Analytics control state
  const [analyticsRange, setAnalyticsRange] = useState<7 | 14 | 30>(7)
  const [showOrdersSeries, setShowOrdersSeries] = useState(true)
  const [showRevenueSeries, setShowRevenueSeries] = useState(true)
  const chartContainerRef = useRef<HTMLDivElement | null>(null)
  const [chartWidth, setChartWidth] = useState(600)
  useEffect(() => {
    const handle = () => {
      if (chartContainerRef.current) {
        setChartWidth(chartContainerRef.current.clientWidth)
      }
    }
    handle()
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [analyticsRange])

  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - (analyticsRange - 1))
  const dayKey = (d: Date) => d.toISOString().slice(0,10)
  const labels: string[] = []
  for (let i = analyticsRange - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    labels.push(dayKey(d))
  }
  interface DayPoint { date: string; orders: number; revenue: number }
  const baseMap: Record<string, DayPoint> = Object.fromEntries(labels.map(l => [l, { date: l, orders: 0, revenue: 0 }]))
  orders.forEach(o => {
    const created = new Date(o.createdAt)
    if (created >= startDate && created <= today) {
      const k = dayKey(created)
      if (baseMap[k]) {
        baseMap[k].orders += 1
        baseMap[k].revenue += Number(o.total) || 0
      }
    }
  })
  const dailySeries = labels.map(l => baseMap[l])
  const maxOrders = Math.max(1, ...dailySeries.map(d => d.orders))
  const maxRevenue = Math.max(1, ...dailySeries.map(d => d.revenue))

  const OrdersRevenueChart = () => {
    const [hover, setHover] = useState<number | null>(null)
  const w = Math.min(Math.max(chartWidth, 320), 1100); const h = analyticsRange === 30 ? 300 : 220; const pad = 42
    const step = dailySeries.length > 1 ? (w - pad * 2) / (dailySeries.length - 1) : 0
    const scaleYOrders = (v: number) => h - pad - (v / maxOrders) * (h - pad * 2)
    const scaleYRevenue = (v: number) => h - pad - (v / maxRevenue) * (h - pad * 2)
    const orderPoints = dailySeries.map((d, i) => [pad + i * step, scaleYOrders(d.orders)])
    const revPoints = dailySeries.map((d, i) => [pad + i * step, scaleYRevenue(d.revenue)])
    const line = (pts: number[][]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ')
    const formatShort = (n: number) => {
      if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
      if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
      return n.toString()
    }
    // Catmull-Rom -> Bezier smoothing for longer ranges (30d)
    const smoothPath = (pts: number[][]) => {
      if (pts.length < 3) return line(pts)
      let d = `M${pts[0][0]},${pts[0][1]}`
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i === 0 ? i : i - 1]
        const p1 = pts[i]
        const p2 = pts[i + 1]
        const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1]
        const tension = 0.25
        const cp1x = p1[0] + (p2[0] - p0[0]) * tension
        const cp1y = p1[1] + (p2[1] - p0[1]) * tension
        const cp2x = p2[0] - (p3[0] - p1[0]) * tension
        const cp2y = p2[1] - (p3[1] - p1[1]) * tension
        d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`
      }
      return d
    }
    const revArea = () => {
      if (!revPoints.length || !showRevenueSeries) return ''
      const first = revPoints[0]; const last = revPoints[revPoints.length - 1]
      return `${line(revPoints)} L ${last[0]},${h - pad} L ${first[0]},${h - pad} Z`
    }
    // Moving average (orders) for longer ranges
    const showSMA = analyticsRange > 14 && showOrdersSeries
    const smaWindow = 5
    const smaPoints: number[][] = showSMA ? dailySeries.map((d, i) => {
      const start = Math.max(0, i - Math.floor(smaWindow / 2))
      const end = Math.min(dailySeries.length - 1, i + Math.floor(smaWindow / 2))
      const slice = dailySeries.slice(start, end + 1)
      const avg = slice.reduce((a,b)=>a+b.orders,0)/slice.length
      return [orderPoints[i][0], scaleYOrders(avg)]
    }) : []
    const handleMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
      const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
      const x = e.clientX - rect.left - pad
      const idx = Math.round(x / step)
      if (idx >= 0 && idx < dailySeries.length) setHover(idx)
      else setHover(null)
    }
    const handleLeave = () => setHover(null)
    const hoverPoint = hover != null ? dailySeries[hover] : null
    const totalOrders = dailySeries.reduce((a,b)=>a+b.orders,0)
    const totalRevenue = dailySeries.reduce((a,b)=>a+b.revenue,0)
  const labelStride = analyticsRange === 30 ? 3 : analyticsRange <= 14 ? 1 : 2
    const showBars = showOrdersSeries && analyticsRange <= 14
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h4 className="text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">Last {analyticsRange} Days</h4>
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium">
            <TooltipProvider>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1">
                        <Switch id="orders-toggle" checked={showOrdersSeries} onCheckedChange={(v)=>setShowOrdersSeries(Boolean(v))} />
                        <label htmlFor="orders-toggle" className="text-xs font-medium cursor-pointer flex items-center gap-1 text-orange-600">{showOrdersSeries ? 'Orders' : <span className="flex items-center gap-1"><EyeOff className="h-3 w-3" /> Orders</span>}</label>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Toggle orders series</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1">
                        <Switch id="revenue-toggle" checked={showRevenueSeries} onCheckedChange={(v)=>setShowRevenueSeries(Boolean(v))} />
                        <label htmlFor="revenue-toggle" className="text-xs font-medium cursor-pointer flex items-center gap-1 text-sky-600">Revenue</label>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Toggle revenue series</TooltipContent>
                  </Tooltip>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <ToggleGroup type="single" value={String(analyticsRange)} onValueChange={(v)=> v && setAnalyticsRange(Number(v) as 7|14|30)}>
                        {['7','14','30'].map(r => (
                          <ToggleGroupItem key={r} value={r}>{r}d</ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Select range</TooltipContent>
                </Tooltip>
                {showSMA && <span className="text-[10px] text-gray-400">5d avg line</span>}
              </div>
            </TooltipProvider>
          </div>
        </div>
        <div className="relative" ref={chartContainerRef}>
          {hoverPoint && (
            <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 md:left-auto md:right-2 md:translate-x-0 z-10">
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-3 py-2 shadow-sm text-[11px] font-medium flex flex-col gap-0.5">
                <span className="text-gray-500 dark:text-gray-400">{hoverPoint.date}</span>
                {showOrdersSeries && <span className="text-orange-600 dark:text-orange-400">{hoverPoint.orders} orders</span>}
                {showRevenueSeries && <span className="text-sky-600 dark:text-sky-400">₹{hoverPoint.revenue.toFixed(2)}</span>}
                {showSMA && hover != null && <span className="text-gray-600 dark:text-gray-300">Avg ~{(() => { const p = smaPoints[hover]; if(!p) return '-'; // invert scale to value
                  const yVal = ((h - pad) - (p[1] - (pad))) / (h - pad * 2) * maxOrders; return Math.round(yVal)
                })()} orders</span>}
              </div>
            </div>
          )}
          <svg
            viewBox={`0 0 ${w} ${h}`}
            role="img"
            aria-label="Chart showing orders and revenue trends"
            className="w-full max-w-full select-none"
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
          >
            <defs>
              <linearGradient id="revGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(14,165,233,0.45)" />
                <stop offset="100%" stopColor="rgba(14,165,233,0)" />
              </linearGradient>
              <linearGradient id="ordGradient" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#fb923c" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Horizontal grid */}
            {Array.from({ length: 4 }).map((_, i) => {
              const y = pad + ((h - pad * 2) / 3) * i
              return <line key={i} x1={pad} x2={w - pad} y1={y} y2={y} className="stroke-gray-200 dark:stroke-gray-800" strokeWidth={1} strokeDasharray="4 4" />
            })}
            {/* Bars for orders (short ranges only) */}
            {showBars && orderPoints.map((p, i) => {
              const barW = Math.max(6, step * 0.4)
              const x = p[0] - barW / 2
              const y = p[1]
              const hBar = (h - pad) - y
              return <rect key={i} x={x} y={y} width={barW} height={hBar} rx={2} className="fill-orange-400/60 dark:fill-orange-500/50 hover:fill-orange-500 transition" />
            })}
            {/* Revenue area & line */}
            {showRevenueSeries && <path d={revArea()} fill="url(#revGradient)" />}
            {showRevenueSeries && (
              <path
                d={analyticsRange === 30 ? smoothPath(revPoints) : line(revPoints)}
                fill="none"
                stroke="#0ea5e9"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}
            {/* Orders line over bars */}
            {showOrdersSeries && (
              <path
                d={analyticsRange === 30 ? smoothPath(orderPoints) : line(orderPoints)}
                fill="none"
                stroke="url(#ordGradient)"
                strokeWidth={2.2}
                strokeLinejoin="round"
                strokeLinecap="round"
                filter="url(#glow)"
              />
            )}
            {/* Orders SMA line */}
            {showSMA && <path d={line(smaPoints)} fill="none" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 4" strokeLinecap="round" />}
            {/* Axes labels */}
            {dailySeries.map((d, i) => (i % labelStride === 0 || i === dailySeries.length - 1) && (
              <g key={d.date}>
                <text x={pad + i * step} y={h - pad + 14} textAnchor="middle" className="fill-gray-400 dark:fill-gray-600 font-medium" fontSize={9}>{d.date.slice(5).replace('-', '/')}</text>
              </g>
            ))}
            {/* Y-axis ticks (orders left) */}
            {Array.from({length:4}).map((_,i)=>{
              const v = (maxOrders/3)*i
              const y = scaleYOrders(v)
              return <text key={'ol'+i} x={pad-6} y={y+4} textAnchor="end" className="fill-orange-500/70 dark:fill-orange-300 font-medium" fontSize={9}>{i===0?0:Math.round(v)}</text>
            })}
            {/* Y-axis ticks (revenue right) */}
            {Array.from({length:4}).map((_,i)=>{
              const v = (maxRevenue/3)*i
              const y = scaleYRevenue(v)
              return <text key={'rl'+i} x={w-pad+6} y={y+4} textAnchor="start" className="fill-sky-600/70 dark:fill-sky-300 font-medium" fontSize={9}>{i===0?0:formatShort(Math.round(v))}</text>
            })}
            {/* Hover marker */}
            {hover != null && (
              <g>
                <line x1={orderPoints[hover][0]} x2={orderPoints[hover][0]} y1={pad - 4} y2={h - pad + 4} stroke="#fb923c" strokeDasharray="4 4" strokeWidth={1} />
                {showOrdersSeries && <circle cx={orderPoints[hover][0]} cy={orderPoints[hover][1]} r={5} fill="#fff" stroke="#fb923c" strokeWidth={2} />}
                {showRevenueSeries && <circle cx={revPoints[hover][0]} cy={revPoints[hover][1]} r={5} fill="#0ea5e9" stroke="#fff" strokeWidth={2} />}
              </g>
            )}
          </svg>
        </div>
        <div className="grid grid-cols-3 gap-4 text-[11px] font-medium text-gray-500 dark:text-gray-400">
          <div className="flex flex-col gap-0.5"><span>Total Orders</span><span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{totalOrders}</span></div>
          <div className="flex flex-col gap-0.5"><span>Avg / Day</span><span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{(totalOrders / dailySeries.length).toFixed(1)}</span></div>
          <div className="flex flex-col gap-0.5"><span>{analyticsRange}d Revenue</span><span className="text-sm font-semibold text-gray-800 dark:text-gray-200">₹{totalRevenue.toFixed(0)}</span></div>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar active={activeTab} onChange={setActiveTab} user={userInfo} onLogout={handleLogout} />
      <SidebarInset>
  <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4 bg-white/70 dark:bg-gray-950/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-gray-950/60">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink>Admin</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          {/* Navbar actions removed as requested (user info & logout now only in sidebar) */}
          <div className="ml-auto" />
        </header>
  <main className="flex-1 p-4 md:p-6 bg-gradient-to-b from-orange-50/40 via-background to-background dark:from-gray-900 dark:via-gray-950 dark:to-gray-950 overflow-y-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
  <TabsList className="flex flex-wrap gap-2 bg-white/60 dark:bg-gray-900/60 p-1 rounded-md border border-orange-200/60 dark:border-gray-800 shadow-sm backdrop-blur">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'restaurants', label: 'Restaurants', icon: Store },
            { id: 'orders', label: 'Orders', icon: ShoppingBag },
            { id: 'delivery', label: 'Delivery', icon: Truck },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-600 flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition"
              >
                <Icon className="h-4 w-4" /> {tab.label}
              </TabsTrigger>
            )
          })}
        </TabsList>
            
        {/* Overview Tab */}
  <TabsContent value="overview" className="space-y-10">
            {/* Primary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              <StatCard label="Total Users" icon={Users} value={stats.totalUsers} trend="+12%" accent="from-blue-50 via-white to-white" iconBg="bg-blue-500/10 text-blue-600" />
              <StatCard label="Active Restaurants" icon={Store} value={stats.totalRestaurants} trend="+8%" accent="from-green-50 via-white to-white" iconBg="bg-green-500/10 text-green-600" />
              <StatCard label="Total Orders" icon={ShoppingBag} value={stats.totalOrders} trend="+24%" accent="from-purple-50 via-white to-white" iconBg="bg-purple-500/10 text-purple-600" />
              <StatCard label="Total Revenue" icon={IndianRupee} value={stats.totalRevenue} suffix="" trend="+18%" accent="from-orange-50 via-white to-white" iconBg="bg-orange-500/10 text-orange-600" />
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              {/* Operational Insights */}
              <Card className="xl:col-span-2 border-gray-200/80 dark:border-gray-800/80 shadow-sm bg-white/70 dark:bg-gray-950/40 backdrop-blur">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-semibold tracking-wide flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-orange-600" aria-hidden="true" /> <span>Operational Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                  {/** Derived percentages (client-side approximation) */}
                  {(() => {
                    const approvalPct = (stats.pendingApprovals && stats.totalRestaurants)
                      ? (stats.pendingApprovals / (stats.pendingApprovals + stats.totalRestaurants)) * 100
                      : 0
                    const activePartnersPct = (stats.activeDeliveryPartners && deliveryPartners.length)
                      ? (stats.activeDeliveryPartners / deliveryPartners.length) * 100
                      : 0
                    const avgTarget = 500 // assumed business target AOV
                    const avgUtilPct = stats.avgOrderValue ? (stats.avgOrderValue / avgTarget) * 100 : 0
                    const completionPct = stats.completionRate
                    return (
                      <div className="space-y-5">
                        <ProgressStat label="Completion Rate" value={completionPct} color="green" />
                        <ProgressStat label="Approval Backlog" value={approvalPct} color="purple" />
                        <ProgressStat label="Active Partners" value={activePartnersPct} color="blue" />
                        <ProgressStat label="Avg Order Value" value={avgUtilPct} color="orange" />
                      </div>
                    )
                  })()}
                  <div className="flex flex-col justify-between">
                    <div className="rounded-xl border border-dashed border-orange-300/60 dark:border-orange-500/30 bg-gradient-to-br from-orange-50/60 via-white to-white dark:from-orange-950/20 dark:via-gray-950 dark:to-gray-950 p-5 shadow-sm">
                      <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-300 mb-3 flex items-center gap-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-orange-500/10 text-orange-600 ring-1 ring-orange-500/20 text-[11px] font-bold">QS</span>
                        Quick Snapshot
                      </h4>
                      <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400 font-medium">
                        <li className="flex items-center justify-between"><span className="flex items-center gap-1">Pending Approvals</span><span className="px-2 py-0.5 rounded-md bg-yellow-100 text-yellow-800 text-[11px] font-semibold">{stats.pendingApprovals}</span></li>
                        <li className="flex items-center justify-between"><span className="flex items-center gap-1">Active Delivery Partners</span><span className="px-2 py-0.5 rounded-md bg-green-100 text-green-800 text-[11px] font-semibold">{stats.activeDeliveryPartners}</span></li>
                        <li className="flex items-center justify-between"><span className="flex items-center gap-1">Avg Order Value</span><span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px] font-semibold">₹{stats.avgOrderValue}</span></li>
                        <li className="flex items-center justify-between"><span className="flex items-center gap-1">Completion Rate</span><span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px] font-semibold">{stats.completionRate}%</span></li>
                      </ul>
                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <Button size="sm" variant="outline" className="border-yellow-300/60 bg-yellow-50 hover:bg-yellow-100 text-yellow-700" onClick={() => setActiveTab('restaurants')} aria-label="Review restaurant applications">Review Apps</Button>
                        <Button size="sm" variant="outline" className="border-green-300/60 bg-green-50 hover:bg-green-100 text-green-700" onClick={() => setActiveTab('delivery')} aria-label="Manage delivery partners">Manage Partners</Button>
                        <Button size="sm" variant="outline" className="col-span-2 border-blue-300/60 bg-blue-50 hover:bg-blue-100 text-blue-700" onClick={() => setActiveTab('orders')} aria-label="View orders">View Orders</Button>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-4">Client-side approximations. For authoritative analytics export full report.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Focus */}
              <Card className="relative overflow-hidden border-gray-200/80 dark:border-gray-800/80 shadow-sm bg-white/70 dark:bg-gray-950/40 backdrop-blur">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-orange-400/20 to-pink-500/10 blur-2xl" />
                <CardHeader className="pb-3 relative">
                  <CardTitle className="text-sm font-semibold tracking-wide flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-orange-600" aria-hidden="true" /> <span>Revenue Pulse</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 relative">
                  <div>
                    <div className="text-3xl font-bold leading-none tracking-tight">₹{stats.totalRevenue.toLocaleString()}</div>
                    <p className="mt-1 text-xs text-green-600 flex items-center gap-1 font-medium" aria-label="Revenue growth 18 percent"><TrendingUp className="h-3 w-3" /> +18% growth</p>
                  </div>
                  {(() => {
                    // Simple illustrative split; in a real app pull from API
                    const total = stats.totalRevenue || 1
                    const platformFees = Math.round(total * 0.12)
                    const deliveryEarnings = Math.round(total * 0.35)
                    const partnerShare = Math.round(total * 0.38)
                    const other = Math.max(0, total - (platformFees + deliveryEarnings + partnerShare))
                    const segments: { label: string; value: number; colors: string }[] = [
                      { label: 'Platform Fees', value: platformFees, colors: 'from-orange-400 to-orange-600' },
                      { label: 'Delivery Earnings', value: deliveryEarnings, colors: 'from-green-400 to-green-600' },
                      { label: 'Partner Share', value: partnerShare, colors: 'from-purple-400 to-purple-600' },
                      { label: 'Other', value: other, colors: 'from-sky-400 to-sky-600' }
                    ]
                    return (
                      <div className="space-y-2">
                        {segments.map(seg => {
                          const percent = (seg.value / total) * 100
                          return (
                            <div key={seg.label} className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-gray-400">
                                <span>{seg.label}</span><span>{percent.toFixed(1)}%</span>
                              </div>
                              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                <div className={`h-full bg-gradient-to-r ${seg.colors} animate-[grow_1.1s_ease]`} style={{ width: percent + '%' }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-orange-600 hover:bg-orange-700 text-white shadow" aria-label="Download revenue report">Download Report</Button>
                    <Button size="sm" variant="outline" className="flex-1 border-orange-300/60 text-orange-700 hover:bg-orange-50" aria-label="Export detailed analytics" onClick={() => setActiveTab('orders')}>Detailed View</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
        </TabsContent>

        {/* User Management Tab */}
  <TabsContent value="users" className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b">
              <h2 className="text-lg font-semibold">User Management</h2>
              <div className="flex flex-wrap gap-3 items-center">
                <SearchBar placeholder="Search users..." />
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-9 rounded-md border border-input bg-background px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
                >
                  {[5,10,20,50].map(n => <option key={n} value={n}>{n} / page</option>)}
                </select>
              </div>
            </div>
            <div className="relative rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-auto max-h-[65vh]">
      <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur sticky top-0 z-10">
                  <TableHead>
                    <SortButton
                      active={userSort.key === 'name'}
                      direction={userSort.direction}
                      onClick={() => setUserSort(s => nextSort(s, 'name'))}
                    >User</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton
                      active={userSort.key === 'role'}
                      direction={userSort.direction}
                      onClick={() => setUserSort(s => nextSort(s, 'role'))}
                    >Role</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton
                      active={userSort.key === 'createdAt'}
                      direction={userSort.direction}
                      onClick={() => setUserSort(s => nextSort(s, 'createdAt'))}
                    >Joined</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton
                      active={userSort.key === 'isActive'}
                      direction={userSort.direction}
                      onClick={() => setUserSort(s => nextSort(s, 'isActive'))}
                    >Status</SortButton>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading.users && (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell colSpan={5} className="h-8">
                        <div className="h-2 w-1/2 bg-gray-200 rounded" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {!loading.users && userPaginated.slice.map(user => (
                  <TableRow key={user._id} className="hover:bg-gray-50 odd:bg-white even:bg-gray-50/40">
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium leading-none">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge color={user.role === 'admin' ? 'red' : user.role === 'restaurant' ? 'blue' : user.role === 'delivery' ? 'green' : 'gray'}>
                        {user.role}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <StatusBadge color={user.isActive ? 'green' : 'red'}>{user.isActive ? 'Active' : 'Inactive'}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={user.isActive ? 'outline' : 'default'}
                        className={user.isActive ? 'text-red-600 border-red-200 hover:bg-red-50' : 'bg-green-600 hover:opacity-90'}
                        onClick={() => handleUserStatusToggle(user._id, user.isActive)}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PageControls page={userPaginated.current} totalPages={userPaginated.totalPages} onChange={setUserPage} />
            </div>
  </TabsContent>

        {/* Restaurant Approvals Tab */}
  <TabsContent value="restaurants" className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b">
              <h2 className="text-lg font-semibold">Restaurant Approvals</h2>
              <div className="flex flex-wrap gap-3 items-center">
                <SearchBar placeholder="Search restaurants..." />
                <StatusSelect
                  value={filterStatus}
                  onChange={setFilterStatus}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'rejected', label: 'Rejected' }
                  ]}
                />
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-9 rounded-md border border-input bg-background px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
                >
                  {[5,10,20,50].map(n => <option key={n} value={n}>{n} / page</option>)}
                </select>
              </div>
            </div>
            <div className="relative rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-auto max-h-[65vh]">
      <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur sticky top-0 z-10">
                  <TableHead>
                    <SortButton active={restaurantSort.key === 'name'} direction={restaurantSort.direction} onClick={() => setRestaurantSort(s => nextSort(s, 'name'))}>Restaurant</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton active={restaurantSort.key === 'owner.name'} direction={restaurantSort.direction} onClick={() => setRestaurantSort(s => nextSort(s, 'owner.name'))}>Owner</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton active={restaurantSort.key === 'createdAt'} direction={restaurantSort.direction} onClick={() => setRestaurantSort(s => nextSort(s, 'createdAt'))}>Applied</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton active={restaurantSort.key === 'status'} direction={restaurantSort.direction} onClick={() => setRestaurantSort(s => nextSort(s, 'status'))}>Status</SortButton>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading.restaurants && (
                  [...Array(4)].map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell colSpan={5} className="h-10"><div className="h-3 w-1/3 bg-gray-200 rounded" /></TableCell>
                    </TableRow>
                  ))
                )}
                {!loading.restaurants && restaurantPaginated.slice.map(restaurant => (
                  <TableRow key={restaurant._id} className="hover:bg-gray-50 odd:bg-white even:bg-gray-50/40">
                    <TableCell className="font-medium">{restaurant.name}</TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium leading-none">{restaurant.owner.name}</p>
                        <p className="text-xs text-muted-foreground">{restaurant.owner.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(restaurant.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <StatusBadge color={restaurant.status === 'approved' ? 'green' : restaurant.status === 'rejected' ? 'red' : 'yellow'}>{restaurant.status}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {restaurant.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-200 text-green-700 hover:bg-green-50"
                            onClick={() => handleRestaurantApproval(restaurant._id, 'approved')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-700 hover:bg-red-50"
                            onClick={() => handleRestaurantApproval(restaurant._id, 'rejected')}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PageControls page={restaurantPaginated.current} totalPages={restaurantPaginated.totalPages} onChange={setRestaurantPage} />
            </div>
  </TabsContent>

        {/* Order Management Tab */}
  <TabsContent value="orders" className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b">
              <h2 className="text-lg font-semibold">Order Management</h2>
              <div className="flex flex-wrap gap-3 items-center">
                <SearchBar placeholder="Search orders..." />
                <StatusSelect
                  value={filterStatus}
                  onChange={setFilterStatus}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'confirmed', label: 'Confirmed' },
                    { value: 'preparing', label: 'Preparing' },
                    { value: 'ready', label: 'Ready' },
                    { value: 'out-for-delivery', label: 'Out for Delivery' },
                    { value: 'delivered', label: 'Delivered' },
                    { value: 'cancelled', label: 'Cancelled' }
                  ]}
                />
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-9 rounded-md border border-input bg-background px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
                >
                  {[5,10,20,50].map(n => <option key={n} value={n}>{n} / page</option>)}
                </select>
              </div>
            </div>
            <div className="relative rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-auto max-h-[65vh]">
      <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur sticky top-0 z-10">
                  <TableHead>
                    <SortButton active={orderSort.key === 'orderNumber'} direction={orderSort.direction} onClick={() => setOrderSort(s => nextSort(s, 'orderNumber'))}>Order</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton active={orderSort.key === 'customer.name'} direction={orderSort.direction} onClick={() => setOrderSort(s => nextSort(s, 'customer.name'))}>Customer</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton active={orderSort.key === 'restaurant.name'} direction={orderSort.direction} onClick={() => setOrderSort(s => nextSort(s, 'restaurant.name'))}>Restaurant</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton active={orderSort.key === 'status'} direction={orderSort.direction} onClick={() => setOrderSort(s => nextSort(s, 'status'))}>Status</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton active={orderSort.key === 'total'} direction={orderSort.direction} onClick={() => setOrderSort(s => nextSort(s, 'total'))}>Total</SortButton>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading.orders && (
                  [...Array(6)].map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell colSpan={6} className="h-10"><div className="h-3 w-1/2 bg-gray-200 rounded" /></TableCell>
                    </TableRow>
                  ))
                )}
                {!loading.orders && orderPaginated.slice.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      {orders.length === 0 ? 'No orders available' : 'No orders match your search'}
                    </TableCell>
                  </TableRow>
                ) : !loading.orders && (
                  orderPaginated.slice.map(order => (
                    <TableRow key={order._id} className="hover:bg-gray-50 odd:bg-white even:bg-gray-50/40">
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-medium leading-none">#{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium leading-none">{order.customer?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{order.customer?.email || 'No email'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{order.restaurant?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        <StatusBadge
                          color={
                            order.status === 'delivered' ? 'green' :
                            order.status === 'cancelled' ? 'red' :
                            order.status === 'preparing' ? 'yellow' :
                            order.status === 'ready' ? 'purple' :
                            order.status === 'out-for-delivery' ? 'blue' :
                            order.status === 'confirmed' ? 'indigo' : 'gray'
                          }
                        >
                          {order.status === 'out-for-delivery' ? 'Out for Delivery' : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="font-medium">₹{order.total.toFixed(2)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <StatusSelect
                          value={order.status}
                          onChange={(v) => handleOrderStatusUpdate(order._id, v)}
                          options={[
                            { value: 'pending', label: 'Pending' },
                            { value: 'confirmed', label: 'Confirmed' },
                            { value: 'preparing', label: 'Preparing' },
                            { value: 'ready', label: 'Ready' },
                            { value: 'out-for-delivery', label: 'Out for Delivery' },
                            { value: 'delivered', label: 'Delivered' },
                            { value: 'cancelled', label: 'Cancelled' }
                          ]}
                        />
                        <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <PageControls page={orderPaginated.current} totalPages={orderPaginated.totalPages} onChange={setOrderPage} />
            </div>
  </TabsContent>

        {/* Delivery Partners Tab */}
  <TabsContent value="delivery" className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b">
              <h2 className="text-lg font-semibold">Delivery Partners</h2>
              <div className="flex flex-wrap gap-3 items-center">
                <SearchBar placeholder="Search partners..." />
                <StatusSelect
                  value={filterStatus}
                  onChange={setFilterStatus}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'available', label: 'Available' },
                    { value: 'busy', label: 'Busy' },
                    { value: 'offline', label: 'Offline' }
                  ]}
                />
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-9 rounded-md border border-input bg-background px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
                >
                  {[5,10,20,50].map(n => <option key={n} value={n}>{n} / page</option>)}
                </select>
              </div>
            </div>
            <div className="relative rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-auto max-h-[65vh]">
      <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur sticky top-0 z-10">
                  <TableHead>
                    <SortButton active={partnerSort.key === 'name'} direction={partnerSort.direction} onClick={() => setPartnerSort(s => nextSort(s, 'name'))}>Partner</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton active={partnerSort.key === 'email'} direction={partnerSort.direction} onClick={() => setPartnerSort(s => nextSort(s, 'email'))}>Contact</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton active={partnerSort.key === 'totalDeliveries'} direction={partnerSort.direction} onClick={() => setPartnerSort(s => nextSort(s, 'totalDeliveries'))}>Performance</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton active={partnerSort.key === 'status'} direction={partnerSort.direction} onClick={() => setPartnerSort(s => nextSort(s, 'status'))}>Status</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton active={partnerSort.key === 'computedEarnings'} direction={partnerSort.direction} onClick={() => setPartnerSort(s => nextSort(s, 'computedEarnings'))}>Earnings</SortButton>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading.partners && (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell colSpan={6} className="h-10"><div className="h-3 w-1/4 bg-gray-200 rounded" /></TableCell>
                    </TableRow>
                  ))
                )}
                {!loading.partners && partnerPaginated.slice.map(partner => (
                  <TableRow key={partner._id} className="hover:bg-gray-50 odd:bg-white even:bg-gray-50/40">
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium leading-none">{partner.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {partner.location ? 'Location Available' : 'Location Unknown'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium leading-none">{partner.email}</p>
                        <p className="text-xs text-muted-foreground">{partner.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{partner.totalDeliveries || 0} deliveries</TableCell>
                    <TableCell>
                      <StatusBadge color={partner.status === 'available' ? 'green' : partner.status === 'busy' ? 'yellow' : 'red'}>{partner.status}</StatusBadge>
                    </TableCell>
                    <TableCell className="font-medium">
                      ₹{((partner.earnings !== undefined && partner.earnings !== null)
                        ? partner.earnings.toFixed(2)
                        : (partner.totalDeliveries && stats.avgOrderValue
                            ? (partner.totalDeliveries * stats.avgOrderValue * 0.3).toFixed(2)
                            : '0.00'))}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <StatusSelect
                        value={partner.status}
                        onChange={(v) => handlePartnerStatusToggle(partner._id, v)}
                        options={[
                          { value: 'available', label: 'Available' },
                          { value: 'busy', label: 'Busy' },
                          { value: 'offline', label: 'Offline' }
                        ]}
                      />
                      <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PageControls page={partnerPaginated.current} totalPages={partnerPaginated.totalPages} onChange={setPartnerPage} />
            </div>
  </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6">
            <Card className="border-gray-200/80 dark:border-gray-800/80 shadow-sm bg-white/70 dark:bg-gray-950/40 backdrop-blur">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold tracking-wide flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-orange-600" /> Orders & Revenue
                </CardTitle>
                <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  <span className="hidden sm:inline">Last {analyticsRange} days</span>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {orders.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-10 text-center">No order data yet to visualize</div>
                ) : (
                  <OrdersRevenueChart />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}