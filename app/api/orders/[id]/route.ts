
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Order from '@/models/Order'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId
    const { id } = params
    const body = await request.json()
    // Only allow cancelling by the user who owns the order
    const order = await Order.findOne({ _id: id, user: userId })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    if (order.status === 'cancelled') {
      return NextResponse.json({ error: 'Order already cancelled' }, { status: 400 })
    }
    // Decrease restaurant revenue if not already cancelled
    if (order.status !== 'cancelled') {
      // Find the restaurant and decrease revenue
      const Restaurant = (await import('@/models/Restaurant')).default
      let restaurantId = order.restaurant
      // Convert to ObjectId if possible
      if (restaurantId && mongoose.Types.ObjectId.isValid(restaurantId)) {
        restaurantId = new mongoose.Types.ObjectId(restaurantId)
      }
      await Restaurant.updateOne(
        { _id: restaurantId },
        { $inc: { revenue: -order.totalAmount, totalOrders: -1 } }
      )
    }
    order.status = 'cancelled'
    await order.save()
    return NextResponse.json({ success: true, order })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 })
  }
}
