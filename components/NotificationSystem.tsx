'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Check, Clock, Truck } from 'lucide-react'

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
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Simulate real-time notifications
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'order',
        title: 'Order Confirmed',
        message: 'Your order #12345 has been confirmed and is being prepared.',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        actionUrl: '/orders/12345'
      },
      {
        id: '2',
        type: 'delivery',
        title: 'Out for Delivery',
        message: 'Your order is on the way! Expected delivery in 15-20 minutes.',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        read: false,
        actionUrl: '/orders/12344'
      },
      {
        id: '3',
        type: 'promotion',
        title: 'Special Offer',
        message: 'Get 20% off on your next order. Use code SAVE20',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: true
      }
    ]

    setNotifications(mockNotifications)
    setUnreadCount(mockNotifications.filter(n => !n.read).length)

    // Simulate receiving new notifications
    const interval = setInterval(() => {
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: 'system',
        title: 'System Update',
        message: 'New features have been added to improve your experience.',
        timestamp: new Date(),
        read: false
      }

      setNotifications(prev => [newNotification, ...prev])
      setUnreadCount(prev => prev + 1)
    }, 60000) // Every minute

    return () => clearInterval(interval)
  }, [])

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    )
    setUnreadCount(0)
  }

  const removeNotification = (id: string) => {
    const notification = notifications.find(n => n.id === id)
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
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
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-primary hover:text-orange-600"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Remove notification"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {notification.actionUrl && (
                        <a
                          href={notification.actionUrl}
                          className="inline-block mt-2 text-xs text-primary hover:text-orange-600"
                          onClick={() => {
                            markAsRead(notification.id)
                            setShowNotifications(false)
                          }}
                        >
                          View Details →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <a
                href="/notifications"
                className="text-sm text-primary hover:text-orange-600"
                onClick={() => setShowNotifications(false)}
              >
                View All Notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}