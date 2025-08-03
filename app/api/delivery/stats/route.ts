import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import Order from '@/models/Order'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    if (decoded.role !== 'delivery') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayOrders = await Order.find({
      deliveryPersonId: decoded.userId,
      createdAt: { $gte: today },
      status: 'delivered'
    })

    const todayDeliveries = todayOrders.length
    const todayEarnings = todayOrders.reduce((sum, order) => sum + (order.deliveryFee || 5), 0)

    const stats = {
      todayDeliveries,
      todayEarnings,
      avgDeliveryTime: 28,
      rating: 4.8
    }

    return NextResponse.json({ stats })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}