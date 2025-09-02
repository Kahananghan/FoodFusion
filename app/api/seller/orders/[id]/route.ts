import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import Order from '@/models/Order'
import Restaurant from '@/models/Restaurant'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const { status } = await request.json()
    
    // Get the restaurant for this seller
  // @ts-ignore suppress mongoose typing overload complexity
  const restaurant = await Restaurant.findOne({ owner: decoded.userId })
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }
    
    // Update order status
  // @ts-ignore suppress mongoose typing overload complexity
  const matchValues = [restaurant._id, restaurant._id.toString(), restaurant.name]
  // @ts-ignore
  const order = await Order.findOneAndUpdate(
      { _id: params.id, restaurant: { $in: matchValues } },
      { status },
      { new: true }
    )
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Recalculate aggregates (match by name or id)
    try {
      const matchValues = [restaurant._id.toString(), restaurant.name]
      // @ts-ignore
  // @ts-ignore suppress mongoose typing overload complexity
  const allOrders = await Order.find({ restaurant: { $in: matchValues } })
  // Count only non-cancelled orders as 'totalOrders'
  const totalOrders = allOrders.filter((o: any) => o.status !== 'cancelled').length
      const deliveredRevenue = allOrders.reduce((s: number, o: any) => o.status === 'delivered' ? s + o.totalAmount : s, 0)
      let changed = false
      if (restaurant.totalOrders !== totalOrders) { restaurant.totalOrders = totalOrders; changed = true }
      if (restaurant.revenue !== deliveredRevenue) { restaurant.revenue = deliveredRevenue; changed = true }
      if (changed) await restaurant.save()
    } catch (e) {
      console.warn('Failed to update restaurant aggregates after status change', e)
    }

    return NextResponse.json({ message: 'Order status updated successfully', order })
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
  }
}