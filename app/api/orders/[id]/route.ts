
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Order from '@/models/Order'
import Restaurant from '../../../../models/Restaurant'
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
  const rawRestaurantId = order.restaurant
      if (!rawRestaurantId) {
        // nothing to do when order has no restaurant reference
      } else {
        // Ensure we have a string representation to validate
        const restaurantIdStr = typeof rawRestaurantId === 'string' ? rawRestaurantId : rawRestaurantId?.toString?.()
        if (!restaurantIdStr || !mongoose.Types.ObjectId.isValid(restaurantIdStr)) {
          console.warn('Invalid restaurant id on order, skipping aggregates update', restaurantIdStr)
        } else {
          const restaurantObjectId = new mongoose.Types.ObjectId(restaurantIdStr)

          // Efficient: count non-cancelled orders and aggregate delivered revenue in the DB
          const totalOrders = await Order.countDocuments({ restaurant: restaurantObjectId, status: { $ne: 'cancelled' } })
          const revenueAgg: any[] = await Order.aggregate([
            { $match: { restaurant: restaurantObjectId, status: 'delivered' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
          ])
          const deliveredRevenue = (revenueAgg[0] && revenueAgg[0].total) ? revenueAgg[0].total : 0

          await Restaurant.updateOne({ _id: restaurantObjectId }, { $set: { totalOrders, revenue: deliveredRevenue } })
        }
      }
    } catch (e) {
      console.warn('Failed to recalc restaurant aggregates after cancellation', e)
    }
    return NextResponse.json({ success: true, order })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 })
  }
}
