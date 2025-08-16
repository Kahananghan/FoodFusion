import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import Order from '@/models/Order'
import Restaurant from '@/models/Restaurant'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    // Get the restaurant for this seller
    const restaurant = await Restaurant.findOne({ owner: decoded.userId })
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }
    
    // Find orders for this restaurant
    const orders = await Order.find({ restaurant: restaurant.name })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(50)
    
    // Transform orders for frontend
    const transformedOrders = orders.map(order => ({
      _id: order._id,
      orderNumber: `ORD${order._id.toString().slice(-6).toUpperCase()}`,
      customer: {
        name: order.user?.name || 'Unknown',
        email: order.user?.email || 'Unknown'
      },
      items: order.items,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt
    }))

    return NextResponse.json({ orders: transformedOrders })
  } catch (error) {
    console.error('Error fetching seller orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}