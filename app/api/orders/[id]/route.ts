
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
    // Mark order cancelled
    order.status = 'cancelled'
    await order.save()

    // Recalculate restaurant aggregates to keep counts consistent
    try {
      const Restaurant = (await import('@/models/Restaurant')).default
      let restaurantId = order.restaurant
      if (restaurantId && mongoose.Types.ObjectId.isValid(restaurantId)) {
        restaurantId = restaurantId.toString()
      }
      // Count only non-cancelled orders and sum delivered totals
      const matchValues = [restaurantId]
      const relatedOrders = await (await import('@/models/Order')).default.find({ restaurant: { $in: matchValues } })
      const totalOrders = relatedOrders.filter((o: any) => o.status !== 'cancelled').length
      const deliveredRevenue = relatedOrders.reduce((s: number, o: any) => o.status === 'delivered' ? s + o.totalAmount : s, 0)
      await Restaurant.updateOne({ _id: restaurantId }, { $set: { totalOrders, revenue: deliveredRevenue } })
    } catch (e) {
      console.warn('Failed to recalc restaurant aggregates after cancellation', e)
    }
    return NextResponse.json({ success: true, order })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 })
  }
}
