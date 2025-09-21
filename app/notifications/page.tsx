 'use client'

import { useEffect, useState, useMemo } from 'react'
import { Bell, Check, X, Clock, Truck } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from '@/components/ui/table'

interface NotificationItem {
  id: string
  type: 'order' | 'delivery' | 'promotion' | 'system'
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true)
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
              timestamp: n.createdAt,
              read: !!n.read,
              actionUrl: n.actionUrl
            }))
            setNotifications(mapped)
          }
        }
      } catch (e) {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [])

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const format = (iso?: string) => {
    if (!iso) return 'Just now'
    const d = new Date(iso)
    const diff = Date.now() - d.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const icon = (type: string) => {
    switch (type) {
      case 'order': return <Check className="h-5 w-5 text-green-600" />
      case 'delivery': return <Truck className="h-5 w-5 text-blue-600" />
      case 'promotion': return <span className="text-yellow-600">🎉</span>
      default: return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-neutral-900 dark:to-neutral-950 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-6 w-6 text-gray-700" />
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription className="text-sm">Recent activity, alerts and updates</CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge>{unreadCount} unread</Badge>
                <Button variant="ghost" size="sm" onClick={() => setNotifications([])}>Mark all as read</Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="text-center py-6 text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-2">No notifications yet</p>
                <p className="text-xs">You will see updates here when activity happens.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title &amp; message</TableHead>
                    <TableHead className="w-32">When</TableHead>
                    <TableHead className="w-40">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map(n => (
                    <TableRow key={n.id}>
                      <TableCell className="w-24 align-middle">
                        <div className="flex items-center space-x-2">
                          {icon(n.type)}
                          <span className="text-sm text-gray-700 capitalize">{n.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className={`font-medium ${!n.read ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</span>
                          <span className="text-sm text-gray-600 truncate">{n.message}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 align-middle">{format(n.timestamp)}</TableCell>
                      <TableCell className="align-middle">
                        <div className="flex items-center justify-end space-x-2">
                          {!n.read && (
                            <Button size="sm" variant="outline" onClick={() => markAsRead(n.id)}>Mark</Button>
                          )}
                          {n.actionUrl && (
                            <a href={n.type === 'order' ? '/orders' : n.actionUrl} className="inline-block">
                              <Button size="sm">View</Button>
                            </a>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>Showing latest {notifications.length} notifications</TableCaption>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
