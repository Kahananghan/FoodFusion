'use client'

import { useState, useEffect } from 'react'
import { Clock, MapPin, Star } from 'lucide-react'

interface Order {
  _id: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  total: number
  status: string
  createdAt: string
  restaurant: {
    name: string
    address: string
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading orders...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>
        
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No orders found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{order.restaurant.name}</h3>
                    <p className="text-gray-600 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {order.restaurant.address}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
                    <p className="text-gray-500 text-sm mt-1 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2">
                      <span>{item.name} x {item.quantity}</span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total</span>
                      <span>₹{order.total}</span>
                    </div>
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