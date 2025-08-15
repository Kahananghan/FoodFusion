import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const orders = await Order.find({})
      .populate('user', 'name email')
      .populate('deliveryPersonId', 'name')
      .sort({ createdAt: -1 })
      .limit(100)

    // Transform orders to match admin interface expectations
    const transformedOrders = orders.map(order => ({
      _id: order._id,
      orderNumber: `ORD${order._id.toString().slice(-6).toUpperCase()}`,
      customer: {
        name: order.user?.name || 'Unknown',
        email: order.user?.email || 'Unknown'
      },
      restaurant: {
        name: order.restaurant || 'Unknown Restaurant'
      },
      status: order.status,
      total: order.totalAmount,
      createdAt: order.createdAt,
      deliveryPartner: order.deliveryPersonId ? {
        name: order.deliveryPersonId.name
      } : null
    }))

    return NextResponse.json({ orders: transformedOrders })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}