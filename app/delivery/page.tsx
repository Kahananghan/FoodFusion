'use client'

import { useState, useEffect } from 'react'
import { MapPin, Clock, DollarSign, Package, Navigation, CheckCircle, Truck, BarChart3, LogOut, History } from 'lucide-react'
import toast from 'react-hot-toast'

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
}

export default function DeliveryDashboard() {
  const [activeTab, setActiveTab] = useState('available')
  const [availableOrders, setAvailableOrders] = useState<DeliveryOrder[]>([])
  const [myOrders, setMyOrders] = useState<DeliveryOrder[]>([])
  const [stats, setStats] = useState({
    todayDeliveries: 0,
    todayEarnings: 0,
    avgDeliveryTime: 0,
    rating: 0
  })

  useEffect(() => {
    fetchAvailableOrders()
    fetchMyOrders()
    fetchStats()
  }, [])

  const fetchAvailableOrders = async () => {
    try {
      const res = await fetch('/api/delivery/available-orders')
      const data = await res.json()
      if (res.ok) {
        setAvailableOrders(data.orders)
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
        setMyOrders(data.orders)
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

  const getOptimizedRoute = (restaurantAddress: string, customerAddress: string) => {
    // Simulate route optimization
    const googleMapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(restaurantAddress)}/${encodeURIComponent(customerAddress)}`
    window.open(googleMapsUrl, '_blank')
  }

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' })
      if (res.ok) {
        toast.success('Logged out successfully')
        window.location.href = '/'
      } else {
        toast.error('Logout failed')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Delivery Navigation Bar */}
      <nav className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">FoodFusion</h1>
              <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">Delivery Panel</span>
            </div>
            <div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayDeliveries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Earnings</p>
                <p className="text-2xl font-bold text-gray-900">${stats.todayEarnings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Delivery Time</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgDeliveryTime}min</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rating</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rating}⭐</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'available', label: 'Available Orders', icon: Package },
                { id: 'my-orders', label: 'My Orders', icon: Truck },
                { id: 'history', label: 'Delivery History', icon: History }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Available Orders Tab */}
        {activeTab === 'available' && (
          <div className="space-y-4">
            {availableOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                    <p className="text-gray-600">{order.restaurant.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">${order.deliveryFee}</p>
                    <p className="text-sm text-gray-500">{order.distance} km</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-red-500" />
                      Pickup Location
                    </h4>
                    <p className="text-sm text-gray-600">
                      {order.restaurant.address.street}, {order.restaurant.address.city}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-green-500" />
                      Delivery Location
                    </h4>
                    <p className="text-sm text-gray-600">
                      {order.customer.address.street}, {order.customer.address.city}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                  <div className="text-sm text-gray-600">
                    {order.items.map((item, index) => (
                      <span key={index}>
                        {item.quantity}x {item.name}
                        {index < order.items.length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    Est. {new Date(order.estimatedDeliveryTime).toLocaleTimeString()}
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => getOptimizedRoute(
                        `${order.restaurant.address.street}, ${order.restaurant.address.city}`,
                        `${order.customer.address.street}, ${order.customer.address.city}`
                      )}
                      className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center"
                    >
                      <Navigation className="h-4 w-4 mr-1" />
                      Route
                    </button>
                    <button
                      onClick={() => handleAcceptOrder(order._id)}
                      className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Accept Order
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* My Orders Tab */}
        {activeTab === 'my-orders' && (
          <div className="space-y-4">
            {myOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                    <p className="text-gray-600">{order.customer.name} - {order.customer.phone}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'out-for-delivery' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'picked-up' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Customer Address</h4>
                    <p className="text-sm text-gray-600">
                      {order.customer.address.street}, {order.customer.address.city}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Delivery Fee</h4>
                    <p className="text-lg font-bold text-primary">${order.deliveryFee}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                  <div className="space-x-2">
                    {order.status === 'confirmed' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order._id, 'picked-up')}
                        className="bg-yellow-50 text-yellow-600 px-4 py-2 rounded-lg hover:bg-yellow-100 transition-colors"
                      >
                        Mark as Picked Up
                      </button>
                    )}
                    {order.status === 'picked-up' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order._id, 'out-for-delivery')}
                        className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        Out for Delivery
                      </button>
                    )}
                    {order.status === 'out-for-delivery' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order._id, 'delivered')}
                        className="bg-green-50 text-green-600 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        Mark as Delivered
                      </button>
                    )}
                    <button
                      onClick={() => getOptimizedRoute(
                        `${order.restaurant.address.street}, ${order.restaurant.address.city}`,
                        `${order.customer.address.street}, ${order.customer.address.city}`
                      )}
                      className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center"
                    >
                      <Navigation className="h-4 w-4 mr-1" />
                      Navigate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}