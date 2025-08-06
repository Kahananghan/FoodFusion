'use client'

import { useState, useEffect } from 'react'
import { Clock, MapPin, Star } from 'lucide-react'

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
      
      if (response.ok) {
        const data = await response.json()  
        const dbOrders = data.orders.map((order: any) => {
          return {
            id: order._id,
            restaurantId: order.restaurant,
            restaurantName: 'Restaurant',
            items: (order.items || []).map((item: any) => ({
              name: item.menuItem?.name || 'Item',
              quantity: item.quantity || 1,
              price: item.menuItem?.price || 0,
              total: (item.menuItem?.price || 0) * (item.quantity || 1)
            })),
            subtotal: (order.totalAmount || 0) - (order.deliveryFee || 40),
            deliveryFee: order.deliveryFee || 40,
            total: order.totalAmount || 0,
            status: order.status || 'confirmed',
            orderDate: order.createdAt || new Date().toISOString()
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
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{order.restaurantName}</h3>
                    <p className="text-gray-600">Order #{order.id.slice(-6)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {order.status}
                    </span>
                    <p className="text-gray-500 text-sm mt-1 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(order.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 text-black">
                      <span>{item.name} x {item.quantity}</span>
                      <span>₹{item.total}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 text-black">
                    <div className="flex justify-between items-center">
                      <span>Subtotal</span>
                      <span>₹{order.subtotal}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Delivery Fee</span>
                      <span>₹{order.deliveryFee}</span>
                    </div>
                    <div className="flex justify-between items-center font-semibold border-t pt-2 mt-2">
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