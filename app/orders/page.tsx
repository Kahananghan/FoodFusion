"use client"

import { useState, useEffect, useMemo } from 'react'
import { Clock, Truck, CheckCircle2, Hourglass, RefreshCw, Search, Package, ChevronDown, ChevronUp } from 'lucide-react'
import Loader from '@/components/Loader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface Order {
  id: string
  restaurantId: string
  restaurantName: string
  items: Array<{
    name: string
    quantity: number
    price: number
    total: number
  }>
  subtotal: number
  deliveryFee: number
  total: number
  status: string
  orderDate: string
  combinedTotalAmount?: number
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [restaurantNames, setRestaurantNames] = useState<Record<string,string>>({})
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const response = await fetch('/api/orders')
      
      if (response.ok) {
        const data = await response.json()  
        const dbOrders = data.orders.map((order: any) => {
          const items = (order.items || []).map((item: any) => ({
            name: item.menuItem?.name || 'Item',
            quantity: item.quantity || 1,
            price: item.menuItem?.price || 0,
            total: (item.menuItem?.price || 0) * (item.quantity || 1)
          }))
          
          const subtotal = items.reduce((sum, item) => sum + item.total, 0)
          // server may have waived fee if combinedTotalAmount >= 500
          const serverFee = typeof order.deliveryFee === 'number' ? order.deliveryFee : 40
          const deliveryFee = (order.combinedTotalAmount && order.combinedTotalAmount >= 500) ? 0 : (subtotal >= 500 ? 0 : serverFee)
          
          // Normalize status: map legacy 'dispatched' -> 'out-for-delivery'
          let status: string = order.status || 'pending'
          if (status === 'dispatched') status = 'out-for-delivery'

          return {
            id: order._id,
            restaurantId: order.restaurant,
            restaurantName: order.restaurantName || order.restaurant,
            items,
            subtotal,
            deliveryFee,
            total: subtotal + deliveryFee,
            status,
            orderDate: order.createdAt || new Date().toISOString(),
            combinedTotalAmount: order.combinedTotalAmount
          }
        })
        setOrders(dbOrders)
      } else {
        console.error('API response not ok:', response.status)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filtered = useMemo(() => {
    let list = [...orders]
    if (statusFilter !== 'all') list = list.filter(o => o.status === statusFilter)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(o =>
        o.restaurantName.toLowerCase().includes(q) ||
        o.items.some(i => i.name.toLowerCase().includes(q)) ||
        o.id.toLowerCase().includes(q)
      )
    }
    return list.sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
  }, [orders, statusFilter, query])

  // Group by date (YYYY-MM-DD)
  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, Order[]>>((acc, ord) => {
      const d = new Date(ord.orderDate)
      const key = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
      acc[key] = acc[key] || []
      acc[key].push(ord)
      return acc
    }, {})
  }, [filtered])

  const statusMeta: Record<string, { label: string; color: string; icon: JSX.Element }> = {
    pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700', icon: <Clock className="h-3.5 w-3.5" /> },
    confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    preparing: { label: 'Preparing', color: 'bg-amber-100 text-amber-700', icon: <Hourglass className="h-3.5 w-3.5" /> },
  ready: { label: 'Ready', color: 'bg-indigo-100 text-indigo-700', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    'out-for-delivery': { label: 'Out for Delivery', color: 'bg-purple-100 text-purple-700', icon: <Truck className="h-3.5 w-3.5" /> },
    delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: <RefreshCw className="h-3.5 w-3.5" /> },
  }

  const totalSpent = useMemo(() => orders.reduce((s,o) => s + o.total, 0), [orders])
  const deliveredCount = useMemo(() => orders.filter(o => o.status === 'delivered').length, [orders])
  const inProgressCount = useMemo(() => orders.filter(o => ['pending','confirmed','preparing','ready','out-for-delivery'].includes(o.status)).length, [orders])

  // Fetch restaurant names client-side if placeholder still present
  useEffect(() => {
    if (!orders.length) return
    const ids = Array.from(new Set(orders.map(o => o.restaurantId).filter(Boolean))) as string[]
    const missing = ids.filter(id => !restaurantNames[id])
    if (!missing.length) return
    let cancelled = false
    ;(async () => {
      for (const id of missing) {
        // Skip obviously non ObjectId ids to avoid 400
        if (id.length < 12) continue
        try {
          const res = await fetch(`/api/restaurants/${id}`)
          if (!res.ok) continue
          const data = await res.json()
          if (!cancelled && data?.name) {
            setRestaurantNames(prev => ({ ...prev, [id]: data.name }))
          }
        } catch {}
      }
    })()
    return () => { cancelled = true }
  }, [orders, restaurantNames])

  if (loading) {
    return <Loader fullscreen message="Gathering your orders" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-neutral-900 dark:to-neutral-950 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">My Orders</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Track, review and revisit your recent meals.</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
              <Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by item, restaurant or ID" className="pl-10 w-72" />
            </div>
            <Button variant="outline" onClick={() => { setRefreshing(true); fetchOrders(true) }} disabled={refreshing} className="gap-2 text-gray-500">{refreshing && <RefreshCw className="h-4 w-4 animate-spin" />}{!refreshing && <RefreshCw className="h-4 w-4" />}Refresh</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white/80 backdrop-blur border-orange-100/70">
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium">Total Orders</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0"><p className="text-3xl font-bold">{orders.length}</p></CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur border-orange-100/70">
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium">Delivered</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0"><p className="text-3xl font-bold text-green-600">{deliveredCount}</p></CardContent>
          </Card>
            <Card className="bg-white/80 backdrop-blur border-orange-100/70">
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium">In Progress</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0"><p className="text-3xl font-bold text-amber-600">{inProgressCount}</p></CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur border-orange-100/70">
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium">Total Spent</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0"><p className="text-3xl font-bold">₹{totalSpent}</p></CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
          <TabsList className="flex flex-wrap gap-2 bg-orange-100/60 p-1 rounded-xl">
            {['all','pending','confirmed','preparing','ready','out-for-delivery','delivered','cancelled'].map(stat => (
              <TabsTrigger key={stat} value={stat} className={cn('text-xs font-medium rounded-lg px-3 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-600', stat==='all' && 'ml-0')}>{stat === 'all' ? 'All' : statusMeta[stat]?.label || stat}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Orders List */}
        {filtered.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2 border-orange-200/70 bg-white/70">
            <div className="mx-auto h-16 w-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
              <Package className="h-8 w-8" />
            </div>
            <p className="text-gray-600 font-medium">No orders match your filters.</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting search or status.</p>
          </Card>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([date, dayOrders]) => (
              <div key={date} className="space-y-4">
                <div className="sticky top-16 z-10 -mx-4 px-4 py-1.5 backdrop-blur bg-gradient-to-r from-orange-50/90 to-white/90 dark:from-neutral-900/90 dark:to-neutral-950/90 border-l-4 border-orange-400 rounded-md text-sm font-medium text-orange-700 shadow-sm">{date}</div>
                {dayOrders.map(order => {
              const meta = statusMeta[order.status] || statusMeta.pending
              return (
                <Card key={order.id} className="overflow-hidden border-orange-100/70 bg-white/90">
                  <CardHeader className="p-5 pb-2 flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-semibold tracking-tight flex flex-wrap items-center gap-2">
                          <span className="truncate max-w-[240px] sm:max-w-[320px]">{restaurantNames[order.restaurantId] || order.restaurantName}</span>
                          <Badge className={cn('flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium capitalize rounded-full border-0', meta.color)}>{meta.icon}{meta.label}</Badge>
                          {order.deliveryFee===0 && order.subtotal < 500 && order.combinedTotalAmount && order.combinedTotalAmount >= 500 && (
                            <span className="text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Free (Cart ₹{order.combinedTotalAmount}+)</span>
                          )}
                        </CardTitle>
                        <p className="text-xs text-gray-500">#{order.id.slice(-6)} • {order.items.length} item{order.items.length>1?'s':''} • {new Date(order.orderDate).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</p>
                      </div>
                      <div className="flex gap-6 text-sm">
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-wide text-gray-400">Total</p>
                          <p className="text-base font-semibold">₹{order.total}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-wide text-gray-400">Delivery</p>
                          <p className={cn('text-sm font-medium', order.deliveryFee===0 && 'text-green-600')}>{order.deliveryFee===0 ? 'FREE' : `₹${order.deliveryFee}`}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 mt-1" onClick={()=>setExpanded(prev=>{ const n = new Set(prev); n.has(order.id)? n.delete(order.id): n.add(order.id); return n })} aria-label="Toggle details">
                          {expanded.has(order.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {!expanded.has(order.id) && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {order.items.slice(0,3).map((it,i)=>(
                            <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
                              {it.name}{it.quantity>1 && ` ×${it.quantity}`}
                            </span>
                          ))}
                          {order.items.length>3 && <span className="text-[11px] text-gray-500">+{order.items.length-3} more</span>}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  {expanded.has(order.id) && (
                    <CardContent className="pt-0 pb-5 px-5">
                      <div className="rounded-lg border border-orange-100 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-1/2">Item</TableHead>
                              <TableHead className="text-center w-20">Qty</TableHead>
                              <TableHead className="text-center w-28">Price</TableHead>
                              <TableHead className="text-right w-28">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {order.items.map((it,i) => (
                              <TableRow key={i}>
                                <TableCell className="font-medium text-gray-700">{it.name}</TableCell>
                                <TableCell className="text-center">{it.quantity}</TableCell>
                                <TableCell className="text-center">₹{it.price}</TableCell>
                                <TableCell className="text-right font-medium">₹{it.total}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow>
                              <TableCell colSpan={3} className="text-right text-sm font-medium">Subtotal</TableCell>
                              <TableCell className="text-right font-semibold">₹{order.subtotal}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell colSpan={3} className="text-right text-sm font-medium">Delivery Fee</TableCell>
                              <TableCell className={cn('text-right font-semibold', order.deliveryFee===0 && 'text-green-600')}>{order.deliveryFee===0 ? 'FREE' : `₹${order.deliveryFee}`}</TableCell>
                            </TableRow>
                            <TableRow className="bg-orange-50/60">
                              <TableCell colSpan={3} className="text-right text-sm font-semibold">Total</TableCell>
                              <TableCell className="text-right font-bold">₹{order.total}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                      {order.subtotal >= 500 && (
                        <div className="mt-3 flex items-center gap-2 text-xs font-medium text-green-600">
                          <CheckCircle2 className="h-4 w-4" /> Free delivery applied on this order
                        </div>
                      )}
                      {order.deliveryFee===0 && order.subtotal < 500 && order.combinedTotalAmount && order.combinedTotalAmount >= 500 && (
                        <div className="mt-3 flex items-center gap-2 text-xs font-medium text-green-600">
                          <CheckCircle2 className="h-4 w-4" /> Free delivery (overall cart ₹{order.combinedTotalAmount}+)
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )})}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}