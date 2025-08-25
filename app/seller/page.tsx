"use client"

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, IndianRupee, Users, ShoppingBag, TrendingUp, Store, BarChart3, CheckCircle, XCircle, Search, LayoutGrid, List as ListIcon, Download, CalendarRange } from 'lucide-react'
import toast from 'react-hot-toast'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { SellerSidebar } from '@/components/seller-sidebar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface MenuItem {
  _id?: string
  name: string
  description: string
  price: number
  category: string
  image: string
  isVegetarian: boolean
  isAvailable: boolean
}

interface RestaurantForm {
  name: string
  description: string
  image: string
  cuisine: string // comma separated in form
  deliveryTime: string
  deliveryFee: string | number
  minimumOrder: string | number
  address: { street: string; city: string; state: string; zipCode: string }
  isOpen: boolean
}

export default function SellerDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [showRestaurantModal, setShowRestaurantModal] = useState(false)
  const [isUpdatingRestaurant, setIsUpdatingRestaurant] = useState(false)
  const [currentRestaurant, setCurrentRestaurant] = useState<any | null>(null)
  const [restaurantForm, setRestaurantForm] = useState<RestaurantForm>({
    name: '', description: '', image: '', cuisine: '', deliveryTime: '', deliveryFee: '', minimumOrder: '',
    address: { street: '', city: '', state: '', zipCode: '' }, isOpen: true
  })
  const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, activeMenuItems: 0, avgRating: 0 })
  const [newItem, setNewItem] = useState<MenuItem>({ name: '', description: '', price: 0, category: '', image: '', isVegetarian: false, isAvailable: true })
  // menu management ui state
  const [menuSearch, setMenuSearch] = useState('')
  const [vegFilter, setVegFilter] = useState<'all'|'veg'|'non-veg'>('all')
  const [availFilter, setAvailFilter] = useState<'all'|'available'|'unavailable'>('all')
  const [menuSort, setMenuSort] = useState<'name'|'price'>('name')
  const [menuView, setMenuView] = useState<'grid'|'list'>('grid')
  // orders management ui state
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all'|'pending'|'confirmed'|'preparing'|'ready'|'delivered'|'cancelled'>('all')
  const [orderSort, setOrderSort] = useState<'date'|'total'>('date')
  // reports ui state
  const [reportRange, setReportRange] = useState<'7d'|'30d'|'all'>('30d')
  const [reportSort, setReportSort] = useState<'date'|'total'>('date')
  const [reportSearch, setReportSearch] = useState('')

  const filteredMenu = menuItems
    .filter(mi => menuSearch.trim()==='' || mi.name.toLowerCase().includes(menuSearch.toLowerCase()) || mi.category.toLowerCase().includes(menuSearch.toLowerCase()))
    .filter(mi => vegFilter==='all' || (vegFilter==='veg' ? mi.isVegetarian : !mi.isVegetarian))
    .filter(mi => availFilter==='all' || (availFilter==='available' ? mi.isAvailable : !mi.isAvailable))
    .sort((a,b)=>{
      if (menuSort==='name') return a.name.localeCompare(b.name)
      if (menuSort==='price') return a.price - b.price
      return 0
    })
  const vegCount = menuItems.filter(mi=>mi.isVegetarian).length
  const availableCount = menuItems.filter(mi=>mi.isAvailable).length

  // derived orders after filters
  const filteredOrders = orders
    .filter(o => orderSearch.trim()==='' ||
      (o.orderNumber && o.orderNumber.toString().toLowerCase().includes(orderSearch.toLowerCase())) ||
      (o.customer?.name && o.customer.name.toLowerCase().includes(orderSearch.toLowerCase()))
    )
    .filter(o => orderStatusFilter==='all' || o.status===orderStatusFilter)
    .sort((a,b)=>{
      if (orderSort==='date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (orderSort==='total') return (b.totalAmount||0) - (a.totalAmount||0)
      return 0
    })
  const deliveredOrders = filteredOrders.filter(o=>o.status==='delivered')
  const deliveredRevenue = deliveredOrders.reduce((s,o)=>s+(o.totalAmount||0),0)
  // overview analytics derived data
  const recentOrders = orders.slice().sort((a:any,b:any)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0,5)
  const itemSalesMap: Record<string,{ name:string; qty:number; revenue:number }> = {}
  orders.forEach((o:any)=>{
    ;(o.items||[]).forEach((it:any)=>{
      const key = it.menuItem?._id || it.menuItem?.name || it.name
      if (!key) return
      if (!itemSalesMap[key]) itemSalesMap[key] = { name: it.menuItem?.name || it.name || 'Item', qty:0, revenue:0 }
      const qty = it.quantity || 0
      const price = it.menuItem?.price || it.price || 0
      itemSalesMap[key].qty += qty
      itemSalesMap[key].revenue += qty * price
    })
  })
  const topItems = Object.values(itemSalesMap).sort((a,b)=> b.qty - a.qty).slice(0,5)
  const maxItemQty = topItems.reduce((m,i)=> i.qty>m?i.qty:m,0)

  // reports derived data (always from full orders list, not filteredOrders)
  const allDelivered = orders.filter(o=>o.status==='delivered')
  const now = Date.now()
  const rangeDaysMap: Record<string, number> = { '7d': 7, '30d': 30 }
  const rangeFilteredDelivered = allDelivered.filter(o=>{
    if (reportRange==='all') return true
    const days = rangeDaysMap[reportRange]
    return (now - new Date(o.createdAt).getTime()) <= days*24*60*60*1000
  }).filter(o=> reportSearch.trim()==='' || (o.orderNumber && o.orderNumber.toString().includes(reportSearch)) )
    .sort((a,b)=>{
      if (reportSort==='date') return new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()
      if (reportSort==='total') return (b.totalAmount||0)-(a.totalAmount||0)
      return 0
    })
  const reportGross = rangeFilteredDelivered.reduce((s,o)=>s+(o.totalAmount||0),0)
  const reportEarning = Math.round(reportGross*0.7)
  const reportPlatform = reportGross - reportEarning
  const avgOrderValue = rangeFilteredDelivered.length? Math.round(reportGross / rangeFilteredDelivered.length):0
  const last7Delivered = allDelivered.filter(o=> (now - new Date(o.createdAt).getTime()) <= 7*24*60*60*1000 )
  const last7Revenue = last7Delivered.reduce((s,o)=>s+(o.totalAmount||0),0)

  const exportReportsCsv = () => {
    if (!rangeFilteredDelivered.length) { toast.error('No data to export'); return }
    const header = ['OrderNumber','CreatedAt','Total','Earning70','Platform30']
    const lines = rangeFilteredDelivered.map(o=>{
      const num = o.orderNumber || o._id.slice(-6)
      const total = o.totalAmount||0
      const earn = Math.round(total*0.7)
      const plat = total-earn
      return [num, new Date(o.createdAt).toISOString(), total, earn, plat].join(',')
    })
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], {type:'text/csv'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-report-${reportRange}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success('Exported CSV')
  }

  const toggleAvailability = async (item: MenuItem) => {
    try {
      const r = await fetch(`/api/seller/menu/${item._id}/update`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({...item, isAvailable: !item.isAvailable}) })
      if (r.ok) { toast.success('Availability updated'); fetchMenuItems() } else { const d=await r.json(); toast.error(d.error||'Failed') }
    } catch { toast.error('Failed') }
  }

  // local styling for seller page form fields (green emphasis)
  const fieldClass = "border-green-300/80 focus-visible:ring-green-500 focus-visible:border-green-500 dark:border-green-700/70"

  // helpers
  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, string> = {
      approved: 'bg-green-100 text-green-700 border-green-200',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
      delivered: 'bg-green-100 text-green-700 border-green-200',
      confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
      preparing: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      ready: 'bg-purple-100 text-purple-700 border-purple-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200'
    }
    return <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${map[status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>{status}</span>
  }

  const StatCard = ({ label, icon: Icon, value, prefix = '' }: { label: string; icon: any; value: number; prefix?: string }) => (
    <Card className="relative overflow-hidden border border-gray-200/70 dark:border-gray-800/70 shadow-sm group bg-gradient-to-br from-white via-white to-white dark:from-gray-900 dark:via-gray-950 dark:to-gray-950 transition hover:shadow-md">
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute -inset-1 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.15),transparent_60%)]" />
      </div>
      <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">{label}</CardTitle>
          <div className="mt-2 text-2xl font-bold tabular-nums">{prefix}{value.toLocaleString()}</div>
        </div>
        <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-green-500/10 text-green-600 ring-1 ring-current/10 group-hover:scale-105 group-hover:bg-green-500/20 transition-all">
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
    </Card>
  )

  // data fetchers
  const fetchUserInfo = async () => { try { const r = await fetch('/api/auth/me'); const d = await r.json(); if (r.ok) setUserInfo(d.user) } catch {} }
  const fetchMenuItems = async () => { try { const r = await fetch('/api/seller/menu'); const d = await r.json(); if (r.ok) { setMenuItems(d.menuItems || []); setStats(s => ({ ...s, activeMenuItems: d.menuItems?.length || 0 })) } } catch { toast.error('Failed menu') } }
  const fetchStats = async () => { try { const r = await fetch('/api/seller/stats'); const d = await r.json(); if (r.ok) setStats(d.stats) } catch {} }
  const fetchOrders = async () => { try { const r = await fetch('/api/seller/orders'); const d = await r.json(); if (r.ok) { setOrders(d.orders || []); calculateStatsFromOrders(d.orders || []) } } catch {} }
  const checkRestaurant = async () => { try { const r = await fetch('/api/seller/restaurant'); const d = await r.json(); if (d.restaurant) { setCurrentRestaurant(d.restaurant); setRestaurantForm({ name: d.restaurant.name||'', description: d.restaurant.description||'', image: d.restaurant.image||'', cuisine: (d.restaurant.cuisine||[]).join(', '), deliveryTime: d.restaurant.deliveryTime||'', deliveryFee: d.restaurant.deliveryFee?.toString()||'', minimumOrder: d.restaurant.minimumOrder?.toString()||'', address: { street: d.restaurant.address?.street||'', city: d.restaurant.address?.city||'', state: d.restaurant.address?.state||'', zipCode: d.restaurant.address?.zipCode||'' }, isOpen: d.restaurant.isOpen !== undefined ? d.restaurant.isOpen : true }) } } catch {} }

  useEffect(() => { fetchMenuItems(); fetchStats(); checkRestaurant(); fetchUserInfo(); fetchOrders() }, [])

  const calculateStatsFromOrders = (ordersList = orders) => {
    const delivered = ordersList.filter(o => o.status === 'delivered')
    const totalOrders = ordersList.length
    const totalRevenue = delivered.reduce((s, o) => s + (o.totalAmount || 0), 0)
    setStats(s => ({ ...s, totalOrders, totalRevenue, avgRating: 4.2 }))
  }

  const handleOrderStatusUpdate = async (orderId: string, status: string) => { try { const r = await fetch(`/api/seller/orders/${orderId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); if (r.ok) { toast.success('Order updated'); fetchOrders() } else toast.error('Update failed') } catch { toast.error('Error') } }
  const handleRestaurantSubmit = async (e: React.FormEvent) => { e.preventDefault(); const payload = { ...restaurantForm, cuisine: restaurantForm.cuisine.split(',').map(c=>c.trim()).filter(Boolean), deliveryFee: restaurantForm.deliveryFee === '' ? 0 : Number(restaurantForm.deliveryFee), minimumOrder: restaurantForm.minimumOrder === '' ? 0 : Number(restaurantForm.minimumOrder) }; try { const method = currentRestaurant ? 'PUT' : 'POST'; const r = await fetch('/api/seller/restaurant', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const d = await r.json(); if (r.ok) { toast.success(currentRestaurant ? 'Restaurant updated' : 'Restaurant created'); setShowRestaurantModal(false); setIsUpdatingRestaurant(false); checkRestaurant() } else toast.error(d.error || 'Failed') } catch { toast.error('Failed') } }
  const handleAddItem = async (e: React.FormEvent) => { e.preventDefault(); try { const r = await fetch('/api/seller/menu', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newItem) }); const d = await r.json(); if (r.ok) { toast.success('Item added'); setShowAddModal(false); setNewItem({ name: '', description: '', price: 0, category: '', image: '', isVegetarian: false, isAvailable: true }); fetchMenuItems() } else toast.error(d.error || 'Failed') } catch { toast.error('Failed') } }
  const handleDeleteItem = async (id: string) => { if (!confirm('Delete item?')) return; try { const r = await fetch(`/api/seller/menu/${id}`, { method: 'DELETE' }); if (r.ok) { toast.success('Deleted'); fetchMenuItems() } else toast.error('Delete failed') } catch { toast.error('Error') } }
  const handleLogout = async () => { try { const r = await fetch('/api/auth/logout', { method: 'POST' }); if (r.ok) { toast.error('Logged out successfully'); window.location.href='/' } else toast.error('Logout failed') } catch { toast.error('Error') } }

  return (
    <SidebarProvider>
      <SellerSidebar active={activeTab} onChange={setActiveTab} user={userInfo} onLogout={handleLogout} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4 bg-white/70 dark:bg-gray-950/70 backdrop-blur">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block"><BreadcrumbLink>Seller</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem><BreadcrumbPage>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto" />
        </header>
        <main className="flex-1 p-4 md:p-6 bg-gradient-to-b from-green-50/40 via-background to-background dark:from-gray-900 dark:via-gray-950 dark:to-gray-950 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="flex flex-wrap gap-2 bg-white/60 dark:bg-gray-900/60 p-1 rounded-md border border-green-200/60 dark:border-gray-800 shadow-sm backdrop-blur">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'restaurant', label: 'Restaurant', icon: Store },
                { id: 'menu', label: 'Menu', icon: Store },
                { id: 'orders', label: 'Orders', icon: ShoppingBag },
                { id: 'reports', label: 'Reports', icon: TrendingUp }
              ].map(t => {
                const Icon = t.icon
                return <TabsTrigger key={t.id} value={t.id} className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-green-600 flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition"><Icon className="h-4 w-4" /> {t.label}</TabsTrigger>
              })}
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              {currentRestaurant && (
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold leading-tight tracking-tight flex items-center gap-2">
                    {currentRestaurant.image && <span className="h-8 w-8 rounded-md overflow-hidden ring-1 ring-green-200 bg-gray-100 flex-shrink-0"><img src={currentRestaurant.image} alt={currentRestaurant.name} className="h-full w-full object-cover" /></span>}
                    {currentRestaurant.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <StatusBadge status={currentRestaurant.status || 'approved'} />
                    <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${currentRestaurant.isOpen ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>{currentRestaurant.isOpen ? 'Open' : 'Closed'}</span>
                    <span className="text-gray-500">Overview</span>
                  </div>
                </div>
              )}
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                <StatCard label="Total Orders" icon={ShoppingBag} value={stats.totalOrders} />
                <StatCard label="Total Revenue" icon={IndianRupee} value={stats.totalRevenue} prefix="₹" />
                <StatCard label="Menu Items" icon={Store} value={stats.activeMenuItems} />
                <StatCard label="Avg Rating" icon={TrendingUp} value={stats.avgRating} />
              </div>
              {/* Secondary Panels */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent Orders */}
                <Card className="border-gray-200/80 dark:border-gray-800/80 shadow-sm flex flex-col lg:col-span-2">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-green-600" /> Recent Orders</CardTitle></CardHeader>
                  <CardContent className="pt-0 flex-1 flex flex-col">
                    {recentOrders.length === 0 ? (
                      <div className="py-10 text-center text-xs text-muted-foreground border border-dashed rounded-md bg-white/50 dark:bg-gray-900/30">No orders yet</div>
                    ) : (
                      <div className="rounded-lg border overflow-auto max-h-[320px]">
                        <Table className="min-w-[640px]">
                          <TableHeader>
                            <TableRow className="bg-gray-50/80 sticky top-0">
                              <TableHead className="w-[140px]">Order # / Date</TableHead>
                              <TableHead>Items</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                              <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {recentOrders.map((o:any)=> (
                              <TableRow key={o._id} className="hover:bg-gray-50">
                                <TableCell className="font-medium align-top">#{o.orderNumber || o._id.slice(-6)}<div className="text-[10px] text-muted-foreground mt-0.5">{new Date(o.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div></TableCell>
                                <TableCell className="text-xs text-muted-foreground align-top">
                                  {(o.items||[]).slice(0,2).map((it:any,i:number)=>(<div key={i}>{it.quantity}x {it.menuItem?.name || it.name}</div>))}
                                  {o.items?.length>2 && <span className="text-[10px]">+{o.items.length-2} more</span>}
                                </TableCell>
                                <TableCell className="text-right font-semibold tabular-nums">₹{(o.totalAmount||0).toLocaleString()}</TableCell>
                                <TableCell className="text-right"><StatusBadge status={o.status} /></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    <div className="pt-3 flex justify-end">
                      <Button size="sm" variant="outline" className="h-8 hover:bg-green-600" onClick={()=>setActiveTab('orders')}>View All Orders</Button>
                    </div>
                  </CardContent>
                </Card>


                {/* Top Items & Quick Actions */}
                <div className="flex flex-col gap-6">
                  <Card className="border-gray-200/80 dark:border-gray-800/80 shadow-sm">
                    <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Store className="h-4 w-4 text-green-600" /> Top Items</CardTitle></CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {topItems.length === 0 ? (
                        <div className="py-6 text-center text-[11px] text-muted-foreground border border-dashed rounded-md bg-white/50 dark:bg-gray-900/30">No sales yet</div>
                      ) : topItems.map(i=> (
                        <div key={i.name} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-medium"><span className="truncate max-w-[140px]">{i.name}</span><span className="tabular-nums text-gray-600">{i.qty} sold</span></div>
                          <div className="h-1.5 rounded bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div className="h-full bg-green-500/80" style={{width: `${maxItemQty? (i.qty/maxItemQty*100).toFixed(0):0}%`}} />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card className="border-gray-200/80 dark:border-gray-800/80 shadow-sm">
                    <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-green-600" /> Quick Actions</CardTitle></CardHeader>
                    <CardContent className="pt-0 grid gap-2 text-xs ">
                      <Button size="sm" variant="outline" className="justify-start h-8 hover:bg-green-600" onClick={()=>{setShowAddModal(true); setActiveTab('menu')}}><Plus className="h-4 w-4 mr-2" /> Add Menu Item</Button>
                      <Button size="sm" variant="outline" className="justify-start h-8 hover:bg-green-600" onClick={()=>{setIsUpdatingRestaurant(true); setShowRestaurantModal(true); setActiveTab('restaurant')}}><Edit className="h-4 w-4 mr-2" /> Edit Restaurant</Button>
                      <Button size="sm" variant="outline" className="justify-start h-8 hover:bg-green-600" onClick={()=>setActiveTab('orders')}><ShoppingBag className="h-4 w-4 mr-2" /> Manage Orders</Button>
                      <Button size="sm" variant="outline" className="justify-start h-8 hover:bg-green-600" onClick={()=>setActiveTab('reports')}><TrendingUp className="h-4 w-4 mr-2" /> View Reports</Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="restaurant" className="space-y-6">
              {!currentRestaurant && (
                <Card className="border-green-200/60 bg-green-50/60 dark:bg-gray-900/40">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">No restaurant created yet</CardTitle></CardHeader>
                  <CardContent className="flex flex-col gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <p>Create your restaurant profile to start adding menu items and receiving orders.</p>
                    <Button size="sm" className="w-fit bg-green-600 hover:bg-green-700" onClick={()=>{setIsUpdatingRestaurant(false); setShowRestaurantModal(true)}}>+ Create Restaurant</Button>
                  </CardContent>
                </Card>
              )}
              {currentRestaurant && (
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Profile Card */}
                  <Card className="relative border-gray-200/80 dark:border-gray-800/80 shadow-sm overflow-hidden flex flex-col">
                    {currentRestaurant.image ? (
                      <div className="relative group">
                        <div className="aspect-[16/7] w-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          <img src={currentRestaurant.image} alt={currentRestaurant.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0 pointer-events-none" />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button size="sm" variant="outline" className="border-none backdrop-blur text-green-700 hover:bg-green-600 hover:text-white" onClick={()=>{setIsUpdatingRestaurant(true); setShowRestaurantModal(true)}}>Edit</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-[16/7] w-full flex flex-col items-center justify-center gap-2 text-xs font-medium text-gray-500 bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-800 dark:to-gray-700 border-b border-dashed border-green-300/60 dark:border-green-700/50">
                        <span>No image uploaded</span>
                        <Button size="xs" variant="outline" className="h-6 px-2 text-[11px]" onClick={()=>{setIsUpdatingRestaurant(true); setShowRestaurantModal(true)}}>Add Image</Button>
                      </div>
                    )}
                    <div className="px-5 pt-4 pb-1 flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2"><Store className="h-4 w-4 text-green-600" /> {currentRestaurant.name}</h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={currentRestaurant.status || 'approved'} />
                          <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${currentRestaurant.isOpen ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>{currentRestaurant.isOpen ? 'Open' : 'Closed'}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">Items: {menuItems.length}</span>
                        </div>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex flex-col gap-1">
                          <p className="text-xs font-medium uppercase text-gray-500">Cuisine</p>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {(currentRestaurant.cuisine||[]).length ? (currentRestaurant.cuisine||[]).map((c:string,i:number)=>(
                              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[11px] font-medium border border-green-200">{c}</span>
                            )) : <span className="text-[11px] text-gray-500">—</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Details Card */}
                  <Card className="border-gray-200/80 dark:border-gray-800/80 shadow-sm flex flex-col">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-green-600" /> Details</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-4 pt-0 flex-1 flex flex-col">
                      <div>
                        <p className="text-xs font-medium uppercase text-gray-500 mb-1">Address</p>
                        {currentRestaurant.address ? (
                          <div className="space-y-1 text-xs leading-relaxed">
                            <p>{currentRestaurant.address.street}</p>
                            <p>{currentRestaurant.address.city}, {currentRestaurant.address.state} {currentRestaurant.address.zipCode}</p>
                          </div>
                        ) : <p className="text-xs text-muted-foreground">No address</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="p-2 rounded-md border bg-white dark:bg-gray-900 flex flex-col gap-1"><span className="font-medium text-[11px] text-gray-500">Total Orders</span><span className="text-sm font-semibold">{stats.totalOrders}</span></div>
                        <div className="p-2 rounded-md border bg-white dark:bg-gray-900 flex flex-col gap-1"><span className="font-medium text-[11px] text-gray-500">Revenue</span><span className="text-sm font-semibold">₹{stats.totalRevenue}</span></div>
                        <div className="p-2 rounded-md border bg-white dark:bg-gray-900 flex flex-col gap-1"><span className="font-medium text-[11px] text-gray-500">Menu Items</span><span className="text-sm font-semibold">{menuItems.length}</span></div>
                        <div className="p-2 rounded-md border bg-white dark:bg-gray-900 flex flex-col gap-1"><span className="font-medium text-[11px] text-gray-500">Rating</span><span className="text-sm font-semibold">{stats.avgRating}</span></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="menu">
              <Card className="border-gray-200/80 dark:border-gray-800/80 shadow-sm">
                <CardHeader className="pb-3 space-y-4">
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center gap-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">Menu Items <span className="text-[11px] font-normal text-gray-500">({filteredMenu.length})</span></CardTitle>
                    <div className="relative w-full sm:w-56">
                      <Input className="pl-8 h-9 text-sm border-green-300 focus-visible:ring-green-500" placeholder="Search name or category..." value={menuSearch} onChange={e=>setMenuSearch(e.target.value)} />
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <div className="inline-flex rounded-md overflow-hidden border bg-white dark:bg-gray-900">
                        <button onClick={()=>setMenuView('grid')} title="Grid view" className={`h-8 w-9 flex items-center justify-center transition ${menuView==='grid' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                          <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button onClick={()=>setMenuView('list')} title="List view" className={`h-8 w-9 flex items-center justify-center border-l transition ${menuView==='list' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                          <ListIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={()=>setShowAddModal(true)}><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
                    </div>
                  </div>

                  {/* Filters Row */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border rounded-full px-2 py-1">
                      <span className="font-medium text-gray-500">Veg</span>
                      {(['all','veg','non-veg'] as const).map(v=> <button key={v} onClick={()=>setVegFilter(v)} className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${vegFilter===v? 'bg-green-600 text-white border-green-600':'bg-transparent text-gray-600 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{v}</button>)}
                    </div>
                    <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border rounded-full px-2 py-1">
                      <span className="font-medium text-gray-500">Status</span>
                      {(['all','available','unavailable'] as const).map(v=> <button key={v} onClick={()=>setAvailFilter(v)} className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${availFilter===v? 'bg-green-600 text-white border-green-600':'bg-transparent text-gray-600 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{v}</button>)}
                    </div>
                    <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border rounded-full px-2 py-1">
                      <span className="font-medium text-gray-500">Sort</span>
                      {(['name','price'] as const).map(v=> <button key={v} onClick={()=>setMenuSort(v)} className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${menuSort===v? 'bg-green-600 text-white border-green-600':'bg-transparent text-gray-600 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{v}</button>)}
                    </div>
                    {(menuSearch || vegFilter!=='all' || availFilter!=='all' || menuSort!=='name') && (
                      <button onClick={()=>{setMenuSearch(''); setVegFilter('all'); setAvailFilter('all'); setMenuSort('name')}} className="px-3 h-7 rounded-full border bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600">Clear</button>
                    )}
                    <div className="ml-auto flex gap-3 text-[10px] font-medium text-gray-500">
                      <span>Total: {menuItems.length}</span>
                      <span>Veg: {vegCount}</span>
                      <span>Available: {availableCount}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {filteredMenu.length === 0 ? (
                    <div className="border border-dashed rounded-lg p-10 text-center text-xs text-muted-foreground flex flex-col gap-3 bg-white/50 dark:bg-gray-900/30">
                      <div>No items found</div>
                      <Button size="sm" className="mx-auto bg-green-600 hover:bg-green-700" onClick={()=>setShowAddModal(true)}><Plus className="h-4 w-4 mr-1" /> Add Your First Item</Button>
                    </div>
                  ) : menuView==='grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredMenu.map(item => (
                        <Card key={item._id} className="group border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
                          <div className="relative h-36 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                            {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : <span className="text-4xl">🍽️</span>}
                            <div className="absolute top-2 left-2 flex gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur border ${item.isVegetarian ? 'bg-green-600/90 text-white border-green-500' : 'bg-red-600/90 text-white border-red-500'}`}>{item.isVegetarian ? 'Veg' : 'Non-Veg'}</span>
                            </div>
                            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[11px] font-semibold">₹{item.price}</div>
                          </div>
                          <CardContent className="p-4 flex flex-col gap-3 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <h4 className="font-semibold leading-tight text-sm line-clamp-1">{item.name}</h4>
                                <p className="text-[11px] text-muted-foreground line-clamp-2">{item.description}</p>
                              </div>
                              <button onClick={()=>toggleAvailability(item)} className={`text-[10px] px-2 py-1 rounded-md font-medium h-fit border transition ${item.isAvailable ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'}`}>{item.isAvailable ? 'Available' : 'Unavailable'}</button>
                            </div>
                            <div className="mt-auto flex gap-2 pt-1">
                              <Button size="sm" variant="outline" className="flex-1 hover:bg-green-600" onClick={()=>setEditingItem(item)}><Edit className="h-4 w-4 mr-1" /> Edit</Button>
                              <Button size="sm" variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-600" onClick={()=>handleDeleteItem(item._id!)}><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border overflow-auto max-h-[60vh]">
                      <Table className="min-w-[720px]">
                        <TableHeader>
                          <TableRow className="bg-gray-50/80 sticky top-0 z-10">
                            <TableHead className="w-[160px]">Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-[110px]">Category</TableHead>
                            <TableHead className="text-center w-[70px]">Veg</TableHead>
                            <TableHead className="text-center w-[90px]">Status</TableHead>
                            <TableHead className="text-right w-[90px]">Price</TableHead>
                            <TableHead className="text-center w-[140px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMenu.map(item => (
                            <TableRow key={item._id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[250px] truncate" title={item.description}>{item.description}</TableCell>
                              <TableCell className="text-xs">{item.category}</TableCell>
                              <TableCell className="text-center">{item.isVegetarian ? <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-100 text-green-700 border border-green-200">Veg</span> : <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-100 text-red-700 border border-red-200">Non</span>}</TableCell>
                              <TableCell className="text-center"><button onClick={()=>toggleAvailability(item)} className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${item.isAvailable ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200':'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'}`}>{item.isAvailable? 'Avail':'Unavail'}</button></TableCell>
                              <TableCell className="text-right font-semibold">₹{item.price}</TableCell>
                              <TableCell className="text-right space-x-1 whitespace-nowrap">
                                <Button size="sm" variant="outline" className="h-7 px-2 hover:bg-green-600 inline-flex items-center gap-1" onClick={()=>setEditingItem(item)}>
                                  <Edit className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Edit</span>
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 px-2 border-red-200 text-red-600 hover:bg-red-600 inline-flex items-center gap-1" onClick={()=>handleDeleteItem(item._id!)}>
                                  <Trash2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Delete</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

    <TabsContent value="orders">
              <Card className="border-gray-200/80 dark:border-gray-800/80 shadow-sm">
                <CardHeader className="pb-3">
      <CardTitle className="text-sm font-semibold tracking-wide flex items-center gap-2">Order Actions <span className="text-[11px] font-normal text-gray-500">Track & update status</span></CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Summary Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 rounded-md border bg-white dark:bg-gray-900 flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-gray-500">Filtered Orders</span>
                      <span className="text-lg font-semibold tabular-nums">{filteredOrders.length}</span>
                      <div className="h-1 mt-1 rounded bg-green-100 dark:bg-green-900/40 overflow-hidden"><div style={{width: `${orders.length? (filteredOrders.length/orders.length*100).toFixed(0):0}%`}} className="h-full bg-green-500/70" /></div>
                    </div>
                    <div className="p-3 rounded-md border bg-white dark:bg-gray-900 flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-gray-500">Delivered</span>
                      <span className="text-lg font-semibold tabular-nums">{deliveredOrders.length}</span>
                      <div className="h-1 mt-1 rounded bg-emerald-100 dark:bg-emerald-900/40 overflow-hidden"><div style={{width: `${filteredOrders.length? (deliveredOrders.length/filteredOrders.length*100).toFixed(0):0}%`}} className="h-full bg-emerald-500/70" /></div>
                    </div>
                    <div className="p-3 rounded-md border bg-white dark:bg-gray-900 flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-gray-500">Delivered Revenue</span>
                      <span className="text-lg font-semibold tabular-nums">₹{deliveredRevenue.toLocaleString()}</span>
                      <div className="text-[10px] text-gray-500">Avg ₹{deliveredOrders.length? Math.round(deliveredRevenue/deliveredOrders.length).toLocaleString():0}/order</div>
                    </div>
                  </div>
                  
                  {/* Toolbar */}
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-3 items-center">
                      <div className="relative w-full sm:w-64">
                        <Input className="pl-8 h-9 text-sm border-green-300 focus-visible:ring-green-500" placeholder="Search order # or customer..." value={orderSearch} onChange={e=>setOrderSearch(e.target.value)} />
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                        {(['all','pending','confirmed','preparing','ready','delivered','cancelled'] as const).map(v=> (
                          <button key={v} onClick={()=>setOrderStatusFilter(v)} className={`px-3 h-8 rounded-full border text-[11px] font-medium capitalize transition ${orderStatusFilter===v? 'bg-green-600 text-white border-green-600 shadow-sm':'bg-white dark:bg-gray-900 text-gray-600 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{v}</button>
                        ))}
                      </div>
                      <div className="flex items-center gap-1">
                        {(['date','total'] as const).map(v=> (
                          <button key={v} onClick={()=>setOrderSort(v)} className={`px-3 h-8 rounded-md border text-[11px] font-medium capitalize transition ${orderSort===v? 'bg-green-600 text-white border-green-600 shadow-sm':'bg-white dark:bg-gray-900 text-gray-600 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{v}</button>
                        ))}
                      </div>
                      {(orderSearch || orderStatusFilter!=='all' || orderSort!=='date') && (
                        <button onClick={()=>{setOrderSearch(''); setOrderStatusFilter('all'); setOrderSort('date')}} className="ml-auto text-[11px] px-3 h-8 rounded-md border bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600">Clear</button>
                      )}
                    </div>
                  </div>
                  {orders.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-sm border border-dashed rounded-lg bg-white/50 dark:bg-gray-900/30">No orders yet</div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-sm border border-dashed rounded-lg bg-white/50 dark:bg-gray-900/30">No orders match filters</div>
                  ) : (
                    <div className="rounded-lg border overflow-auto max-h-[65vh]">
                      <Table className="min-w-[880px]">
                        <TableHeader>
                          <TableRow className="bg-gray-50/80 sticky top-0 z-10">
                            <TableHead className="w-[200px]">Order # / Date</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                            <TableHead className="text-right w-[220px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredOrders.map(order => {
                            const shortId = order.orderNumber || order._id.slice(-6)
                            const created = new Date(order.createdAt).toLocaleString()
                            const status: string = order.status
                            const stepOrder = ['pending','confirmed','preparing','ready','delivered']
                            const currentIdx = stepOrder.indexOf(status)
                            const progressPct = currentIdx >=0 ? ((currentIdx)/(stepOrder.length-1))*100 : 0
                            return (
                              <TableRow key={order._id} className="hover:bg-gray-50 transition">
                                <TableCell className="font-medium align-top">
                                  #{shortId}
                                  <div className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{created}</div>
                                  <div className="mt-2 h-1.5 rounded bg-gray-100 dark:bg-gray-800 overflow-hidden w-full">
                                    <div className="h-full bg-green-500/70 transition-all" style={{width: progressPct + '%'}} />
                                  </div>
                                </TableCell>
                                <TableCell className="align-top">
                                  <div className="text-xs font-medium leading-tight">{order.customer?.name || 'Customer'}</div>
                                  {order.customer?.phone && <div className="text-[10px] text-muted-foreground mt-0.5">{order.customer.phone}</div>}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground align-top">
                                  {order.items?.slice(0,2).map((it:any,i:number)=>(
                                    <div key={i}>{it.quantity}x {it.menuItem?.name || it.name}</div>
                                  ))}
                                  {order.items?.length>2 && <div className="text-[10px]">+{order.items.length-2} more</div>}
                                </TableCell>
                                <TableCell className="font-semibold text-right align-top whitespace-nowrap">₹{order.totalAmount}</TableCell>
                                <TableCell className="text-right align-top"><StatusBadge status={order.status} /></TableCell>
                                <TableCell className="text-right align-top whitespace-nowrap">
                                  <div className="flex flex-wrap gap-1 justify-end">
                                    {status==='pending' && (
                                      <>
                                        <Button size="sm" variant="outline" className="h-7 px-2 hover:bg-green-600" onClick={()=>handleOrderStatusUpdate(order._id,'confirmed')}>Confirm</Button>
                                        <Button size="sm" variant="outline" className="h-7 px-2 border-red-200 text-red-600 hover:bg-red-600" onClick={()=>handleOrderStatusUpdate(order._id,'cancelled')}>Cancel</Button>
                                      </>
                                    )}
                                    {status==='confirmed' && (
                                      <>
                                        <Button size="sm" variant="outline" className="h-7 px-2 hover:bg-green-600" onClick={()=>handleOrderStatusUpdate(order._id,'preparing')}>Start Prep</Button>
                                        <Button size="sm" variant="outline" className="h-7 px-2 border-red-200 text-red-600 hover:bg-red-600" onClick={()=>handleOrderStatusUpdate(order._id,'cancelled')}>Cancel</Button>
                                      </>
                                    )}
                                    {status==='preparing' && (
                                      <Button size="sm" variant="outline" className="h-7 px-2 hover:bg-green-600" onClick={()=>handleOrderStatusUpdate(order._id,'ready')}>Mark Ready</Button>
                                    )}
                                    {status==='ready' && (
                                      <span className="text-[10px] text-green-700 font-medium px-2 py-1 rounded-md bg-green-100 border border-green-200">Ready • awaiting delivery</span>
                                    )}
                                    {status==='delivered' && (
                                      <span className="text-[10px] text-green-600 font-medium">Completed</span>
                                    )}
                                    {status==='cancelled' && (
                                      <span className="text-[10px] text-red-600 font-medium">Cancelled</span>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports">
              <Card className="border-gray-200/80 dark:border-gray-800/80 shadow-sm">
                <CardHeader className="pb-3 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-600" /> Sales Reports <span className="text-[11px] font-normal text-gray-500">({rangeFilteredDelivered.length})</span></CardTitle>
                    <div className="relative w-full sm:w-56">
                      <Input className="pl-8 h-9 text-sm border-green-300 focus-visible:ring-green-500" placeholder="Search order #" value={reportSearch} onChange={e=>setReportSearch(e.target.value)} />
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <div className="inline-flex rounded-md overflow-hidden border bg-white dark:bg-gray-900">
                        {(['7d','30d','all'] as const).map(r=> (
                          <button key={r} onClick={()=>setReportRange(r)} className={`px-3 h-8 text-[11px] font-medium capitalize tracking-wide ${reportRange===r? 'bg-green-600 text-white':'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{r}</button>
                        ))}
                      </div>
                      <div className="inline-flex rounded-md overflow-hidden border bg-white dark:bg-gray-900">
                        {(['date','total'] as const).map(s=> (
                          <button key={s} onClick={()=>setReportSort(s)} className={`px-3 h-8 text-[11px] font-medium capitalize tracking-wide ${reportSort===s? 'bg-green-600 text-white':'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{s}</button>
                        ))}
                      </div>
                      <Button size="sm" variant="outline" className="h-8 px-3 gap-2" onClick={exportReportsCsv}><Download className="h-4 w-4" /> <span className="hidden sm:inline">Export</span></Button>
                      {(reportSearch || reportRange!=='30d' || reportSort!=='date') && (
                        <button onClick={()=>{setReportSearch(''); setReportRange('30d'); setReportSort('date')}} className="h-8 px-3 rounded-md border bg-white dark:bg-gray-900 text-[11px] text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">Clear</button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="p-3 rounded-md border bg-white dark:bg-gray-900 flex flex-col gap-1"><span className="text-[10px] font-medium text-gray-500">Delivered (All)</span><span className="text-lg font-semibold tabular-nums">{allDelivered.length}</span></div>
                    <div className="p-3 rounded-md border bg-white dark:bg-gray-900 flex flex-col gap-1"><span className="text-[10px] font-medium text-gray-500">Gross ({reportRange})</span><span className="text-lg font-semibold tabular-nums">₹{reportGross.toLocaleString()}</span></div>
                    <div className="p-3 rounded-md border bg-white dark:bg-gray-900 flex flex-col gap-1"><span className="text-[10px] font-medium text-gray-500">Earning 70%</span><span className="text-lg font-semibold tabular-nums text-green-700">₹{reportEarning.toLocaleString()}</span></div>
                    <div className="p-3 rounded-md border bg-white dark:bg-gray-900 flex flex-col gap-1"><span className="text-[10px] font-medium text-gray-500">Platform 30%</span><span className="text-lg font-semibold tabular-nums text-amber-600">₹{reportPlatform.toLocaleString()}</span></div>
                    <div className="p-3 rounded-md border bg-white dark:bg-gray-900 flex flex-col gap-1"><span className="text-[10px] font-medium text-gray-500">Avg Order</span><span className="text-lg font-semibold tabular-nums">₹{avgOrderValue.toLocaleString()}</span></div>
                    <div className="p-3 rounded-md border bg-white dark:bg-gray-900 flex flex-col gap-1"><span className="text-[10px] font-medium text-gray-500">Last 7d Rev</span><span className="text-lg font-semibold tabular-nums">₹{last7Revenue.toLocaleString()}</span></div>
                  </div>
                </CardHeader>
                <CardContent>
                  {allDelivered.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted-foreground border border-dashed rounded-lg bg-white/50 dark:bg-gray-900/30">No delivered orders yet</div>
                  ) : rangeFilteredDelivered.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted-foreground border border-dashed rounded-lg bg-white/50 dark:bg-gray-900/30">No results for current filters</div>
                  ) : (
                    <div className="rounded-lg border overflow-auto max-h-[60vh]">
                      <Table className="min-w-[820px]">
                        <TableHeader>
                          <TableRow className="bg-gray-50/80 sticky top-0 z-10">
                            <TableHead className="w-[140px]">Order # / Date</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Earning (70%)</TableHead>
                            <TableHead className="text-right">Platform (30%)</TableHead>
                            <TableHead className="text-right">Avg Diff</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rangeFilteredDelivered.map(o => {
                            const total = o.totalAmount||0
                            const earning = Math.round(total*0.7)
                            const platform = total-earning
                            const diff = avgOrderValue ? Math.round(((total-avgOrderValue)/avgOrderValue)*100) : 0
                            return (
                              <TableRow key={o._id} className="hover:bg-gray-50">
                                <TableCell className="font-medium align-top">#{o.orderNumber || o._id.slice(-6)}<div className="text-[10px] text-muted-foreground mt-0.5">{new Date(o.createdAt).toLocaleString()}</div></TableCell>
                                <TableCell className="text-right tabular-nums">₹{total.toLocaleString()}</TableCell>
                                <TableCell className="text-right tabular-nums text-green-700 font-semibold">₹{earning.toLocaleString()}</TableCell>
                                <TableCell className="text-right tabular-nums text-amber-600">₹{platform.toLocaleString()}</TableCell>
                                <TableCell className={`text-right text-[11px] font-medium ${diff===0?'text-gray-500': diff>0 ? 'text-green-600':'text-red-600'}`}>{diff===0? '—' : (diff>0? '+'+diff: diff)+'%'}</TableCell>
                                <TableCell className="text-right"><StatusBadge status="delivered" /></TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
  <DialogContent className="max-w-lg text-black">
          <DialogHeader>
            <DialogTitle className='mb-4'>Add New Menu Item</DialogTitle>
          </DialogHeader>
      <form onSubmit={handleAddItem} className="space-y-5 text-black">
            <div className="space-y-4">
              <div className="space-y-2">
                <Input className={fieldClass} placeholder="Item Name" required value={newItem.name} onChange={e=>setNewItem(i=>({...i,name:e.target.value}))} />
                <Textarea className={fieldClass} placeholder="Description" required value={newItem.description} onChange={e=>setNewItem(i=>({...i,description:e.target.value}))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input className={fieldClass} type="number" placeholder="Price" required value={newItem.price} onChange={e=>setNewItem(i=>({...i,price: parseFloat(e.target.value)||0}))} />
                <Input className={fieldClass} placeholder="Category" required value={newItem.category} onChange={e=>setNewItem(i=>({...i,category:e.target.value}))} />
              </div>
              <Input className={fieldClass} placeholder="Image URL" value={newItem.image} onChange={e=>setNewItem(i=>({...i,image:e.target.value}))} />
              <div className="flex flex-wrap gap-6 text-sm pt-1">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-black"><input className="accent-green-600" type="radio" name="veg" checked={newItem.isVegetarian} onChange={()=>setNewItem(i=>({...i,isVegetarian:true}))} /><span className="text-xs">Veg</span></label>
                  <label className="flex items-center gap-2 cursor-pointer text-black"><input className="accent-green-600" type="radio" name="veg" checked={!newItem.isVegetarian} onChange={()=>setNewItem(i=>({...i,isVegetarian:false}))} /><span className="text-xs">Non-Veg</span></label>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-black"><input className="accent-green-600" type="checkbox" checked={newItem.isAvailable} onChange={e=>setNewItem(i=>({...i,isAvailable:e.target.checked}))} /><span className="text-xs">Available</span></label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={()=>setShowAddModal(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">Add Item</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingItem} onOpenChange={(o)=>!o && setEditingItem(null)}>
  <DialogContent className="max-w-lg text-black">
          <DialogHeader>
            <DialogTitle className='mb-4'>Edit Menu Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
      <form onSubmit={async e=>{e.preventDefault(); try { const r = await fetch(`/api/seller/menu/${editingItem._id}/update`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(editingItem) }); if (r.ok) { toast.success('Item updated'); setEditingItem(null); fetchMenuItems() } else { const d=await r.json(); toast.error(d.error||'Failed') } } catch { toast.error('Failed') } }} className="space-y-5 text-black">
              <div className="space-y-2">
                <Input className={fieldClass} placeholder="Item Name" required value={editingItem.name} onChange={e=>setEditingItem({...editingItem, name: e.target.value})} />
                <Textarea className={fieldClass} placeholder="Description" required value={editingItem.description} onChange={e=>setEditingItem({...editingItem, description:e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input className={fieldClass} type="number" placeholder="Price" required value={editingItem.price} onChange={e=>setEditingItem({...editingItem, price: parseFloat(e.target.value)||0})} />
                <Input className={fieldClass} placeholder="Category" required value={editingItem.category} onChange={e=>setEditingItem({...editingItem, category:e.target.value})} />
              </div>
              <Input className={fieldClass} placeholder="Image URL" value={editingItem.image} onChange={e=>setEditingItem({...editingItem, image:e.target.value})} />
              <div className="flex flex-wrap gap-6 text-sm pt-1">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-black"><input className="accent-green-600" type="radio" name="veg-edit" checked={editingItem.isVegetarian} onChange={()=>setEditingItem({...editingItem, isVegetarian:true})} /><span className="text-xs">Veg</span></label>
                  <label className="flex items-center gap-2 cursor-pointer text-black"><input className="accent-green-600" type="radio" name="veg-edit" checked={!editingItem.isVegetarian} onChange={()=>setEditingItem({...editingItem, isVegetarian:false})} /><span className="text-xs">Non-Veg</span></label>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-black"><input className="accent-green-600" type="checkbox" checked={editingItem.isAvailable} onChange={e=>setEditingItem({...editingItem, isAvailable:e.target.checked})} /><span className="text-xs">Available</span></label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={()=>setEditingItem(null)}>Cancel</Button>
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">Update Item</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showRestaurantModal} onOpenChange={setShowRestaurantModal}>
  <DialogContent className="max-w-xl text-black">
          <DialogHeader>
            <DialogTitle className='mb-4'>{currentRestaurant ? 'Update Restaurant' : 'Create Restaurant'}</DialogTitle>
          </DialogHeader>
      <form onSubmit={handleRestaurantSubmit} className="space-y-6 text-black">
            <div className="space-y-4">
              <div className="space-y-2">
                <Input className={fieldClass} placeholder="Name" required value={restaurantForm.name} onChange={e=>setRestaurantForm(f=>({...f,name:e.target.value}))} />
                <Textarea className={fieldClass} placeholder="Description" required value={restaurantForm.description} onChange={e=>setRestaurantForm(f=>({...f,description:e.target.value}))} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input className={fieldClass} placeholder="Image URL" required value={restaurantForm.image} onChange={e=>setRestaurantForm(f=>({...f,image:e.target.value}))} />
                <Input className={fieldClass} placeholder="Cuisine (comma separated)" required value={restaurantForm.cuisine} onChange={e=>setRestaurantForm(f=>({...f,cuisine:e.target.value}))} />
              </div>
              <div className="grid sm:grid-cols-4 gap-4">
                <Input className={fieldClass} placeholder="Delivery Time" required value={restaurantForm.deliveryTime} onChange={e=>setRestaurantForm(f=>({...f,deliveryTime:e.target.value}))} />
                <Input className={fieldClass} type="number" placeholder="Delivery Fee" required value={restaurantForm.deliveryFee} onChange={e=>{ const v=e.target.value; setRestaurantForm(f=>({...f,deliveryFee:v===''?'':v})) }} />
                <Input className={fieldClass} type="number" placeholder="Minimum Order" required value={restaurantForm.minimumOrder} onChange={e=>{ const v=e.target.value; setRestaurantForm(f=>({...f,minimumOrder:v===''?'':v})) }} />
                <label className="flex items-center gap-2 text-xs font-medium"><input className="accent-green-600" type="checkbox" checked={restaurantForm.isOpen} onChange={e=>setRestaurantForm(f=>({...f,isOpen:e.target.checked}))} /> Open</label>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase text-black">Address</label>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input className={fieldClass} placeholder="Street" required value={restaurantForm.address.street} onChange={e=>setRestaurantForm(f=>({...f,address:{...f.address,street:e.target.value}}))} />
                  <Input className={fieldClass} placeholder="City" required value={restaurantForm.address.city} onChange={e=>setRestaurantForm(f=>({...f,address:{...f.address,city:e.target.value}}))} />
                  <Input className={fieldClass} placeholder="State" required value={restaurantForm.address.state} onChange={e=>setRestaurantForm(f=>({...f,address:{...f.address,state:e.target.value}}))} />
                  <Input className={fieldClass} placeholder="Zip Code" required value={restaurantForm.address.zipCode} onChange={e=>setRestaurantForm(f=>({...f,address:{...f.address,zipCode:e.target.value}}))} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={()=>{setShowRestaurantModal(false); setIsUpdatingRestaurant(false)}}>Cancel</Button>
              <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">{currentRestaurant ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}