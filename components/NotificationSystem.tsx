'use client'

import { useState, useEffect, useMemo } from 'react'
import { Bell, X, Check, Clock, Truck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Notification {
  id: string
  type: 'order' | 'delivery' | 'promotion' | 'system'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
}

export default function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])
  const [connected, setConnected] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    // Fetch recent notifications on mount (in case SSE missed any)
    const fetchInitial = async () => {
      try {
        
        const res = await fetch('/api/notifications', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          
          if (Array.isArray(data.notifications)) {
            const mapped = data.notifications.map((n: any) => ({
              id: n._id,
              type: n.type,
              title: n.title,
              message: n.message,
              timestamp: n.createdAt ? new Date(n.createdAt) : new Date(),
              read: !!n.read,
              actionUrl: n.actionUrl
            }))
            
            setNotifications(prev => {
              // avoid duplicates by id
              const ids = new Set(prev.map(p => p.id))
              const dedup = mapped.filter((m: any) => !ids.has(m.id))
              return [...dedup, ...prev]
            })
          }
        }
      } catch (e) {
        console.warn('[notifications] fetchInitial failed', e)
        // ignore
      }
    }
    fetchInitial()

    // Connect to server-sent events stream
    let es: EventSource | null = null
    let retryTimeout: number | null = null

    const connect = () => {
      
      // Force a reconnect by including a cache-busting query when user changes
      const url = '/api/notifications/stream'
      es = new EventSource(url)

      es.onopen = () => {
        setConnected(true)
      }

      es.onmessage = (e) => {
        // default messages come as payload in e.data
        try {
          const payload = JSON.parse(e.data)
          // If notification targets a specific user, ignore if not current user
          if (payload && payload.id) {
            if (payload.targetUser && user && payload.targetUser !== user._id) return
            const incoming: Notification = {
              id: payload.id ?? Date.now().toString(),
              type: payload.type ?? 'system',
              title: payload.title ?? 'Notification',
              message: payload.message ?? '',
              timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
              read: false,
              actionUrl: payload.actionUrl
            }
            setNotifications(prev => [incoming, ...prev])
          }
        } catch (err) {
          // ignore malformed messages
        }
      }

      es.addEventListener('notification', (e: MessageEvent) => {
        try {
          const payload = JSON.parse((e as MessageEvent).data)
          if (payload.targetUser && user && payload.targetUser !== user._id) return
          const incoming: Notification = {
            id: payload.id ?? Date.now().toString(),
            type: payload.type ?? 'system',
            title: payload.title ?? 'Notification',
            message: payload.message ?? '',
            timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
            read: false,
            actionUrl: payload.actionUrl
          }
          setNotifications(prev => [incoming, ...prev])
        } catch (err) {
          // ignore
        }
      })

      es.onerror = (err) => {
        console.warn('[notifications] EventSource error', err)
        setConnected(false)
        if (es) {
          try { es.close() } catch (e) {}
        }
        // retry with backoff
        if (retryTimeout) window.clearTimeout(retryTimeout)
        retryTimeout = window.setTimeout(() => connect(), 3000)
      }
    }

    connect()

    return () => {
      if (es) try { es.close() } catch (e) {}
      if (retryTimeout) window.clearTimeout(retryTimeout)
    }
  }, [user])

  // Listen for in-app dispatched notifications (e.g., addToCart returns a notification)
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const custom = e as CustomEvent
        const payload = custom.detail
        if (!payload) return
        // If the notification targets a user, ignore when not matching
        if (payload.targetUser && user && payload.targetUser !== user._id) return
        const incoming: Notification = {
          id: payload.id ?? payload._id ?? Date.now().toString(),
          type: payload.type ?? 'system',
          title: payload.title ?? 'Notification',
          message: payload.message ?? '',
          timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
          read: !!payload.read,
          actionUrl: payload.actionUrl
        }
        setNotifications(prev => [incoming, ...prev])
      } catch (err) {
        // ignore
      }
    }

    window.addEventListener('notificationReceived', handler as EventListener)
    return () => {
      window.removeEventListener('notificationReceived', handler as EventListener)
    }
  }, [user])

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
  }

  const markAllAsRead = () => {
    // Clear the list so read notifications are not visible in the dropdown
    setNotifications([])
  }

  const removeNotification = (id: string) => {
    const notification = notifications.find(n => n.id === id)
    // unreadCount is derived from `notifications` so removing an unread item will update it automatically
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Check className="h-5 w-5 text-green-600" />
      case 'delivery':
        return <Truck className="h-5 w-5 text-blue-600" />
      case 'promotion':
        return <span className="text-yellow-600">🎉</span>
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <Card className="absolute right-0 mt-2 w-96 z-50 shadow-lg border translate-x-52">
          <CardHeader className="p-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-gray-700" />
                <h3 className="text-sm font-semibold">Notifications</h3>
                <Badge variant="secondary" className="ml-2">{unreadCount} unread</Badge>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>Mark all</Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setShowNotifications(false)} aria-label="Close">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">You're all caught up</p>
                <p className="text-xs text-gray-400 mt-1">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div key={notification.id} className={`p-3 hover:bg-gray-50 flex gap-3 items-start ${!notification.read ? 'bg-blue-50' : 'bg-white'}`}>
                    <div className="shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-3">
                        <div className="truncate">
                          <p className={`text-sm font-medium truncate ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>{notification.title}</p>
                          <p className="text-xs text-gray-600 truncate mt-0.5">{notification.message}</p>
                          <p className="text-[11px] text-gray-400 mt-1">{formatTimestamp(notification.timestamp)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {!notification.read && (
                            <Button size="icon" variant="ghost" onClick={() => markAsRead(notification.id)} aria-label="Mark as read">
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => removeNotification(notification.id)} aria-label="Remove">
                            <X className="h-4 w-4 text-gray-500" />
                          </Button>
                        </div>
                      </div>

                      {notification.actionUrl && (
                        <a href={notification.type === 'order' ? '/orders' : notification.actionUrl} className="text-xs text-primary hover:text-orange-600 inline-block mt-2" onClick={() => { markAsRead(notification.id); setShowNotifications(false) }}>
                          View Details →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          {notifications.length > 0 && (
            <CardFooter className="p-3 border-t">
              <div className="text-center w-full">
                <a href="/notifications" className="text-sm text-primary hover:text-orange-600" onClick={() => setShowNotifications(false)}>View All Notifications</a>
              </div>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  )
}