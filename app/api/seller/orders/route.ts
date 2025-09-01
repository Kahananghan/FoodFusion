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
  // @ts-ignore suppress mongoose typing overload complexity
  const restaurant = await Restaurant.findOne({ owner: decoded.userId })
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }
    
    // Find orders for this restaurant. Orders collection stores `restaurant` as ObjectId,
    // so query by the restaurant._id to ensure we return all orders (including cancelled).
    // @ts-ignore suppress mongoose typing overload complexity
    // Orders historically stored `restaurant` as a string (name or ObjectId string).
    // Query for any of: ObjectId, ObjectId string, or restaurant name to support mixed data.
    const restaurantId = restaurant._id
    const restaurantIdStr = restaurant._id.toString()
    const restaurantName = restaurant.name
    const orders = await Order.find({
      $or: [
        { restaurant: restaurantId },
        { restaurant: restaurantIdStr },
        { restaurant: restaurantName }
      ]
    })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
    
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
      deliveryFee: order.deliveryFee,
      combinedTotalAmount: order.combinedTotalAmount,
      freeDelivery: order.deliveryFee === 0,
      freeDeliveryReason: (order.deliveryFee === 0) ? (
        (order.combinedTotalAmount && order.combinedTotalAmount >= 500 && order.totalAmount < 500 + (order.deliveryFee || 0))
          ? 'waived-via-combined-cart'
          : 'subtotal-threshold'
      ) : null,
      status: order.status,
      createdAt: order.createdAt
    }))

    return NextResponse.json({ orders: transformedOrders })
  } catch (error) {
    console.error('Error fetching seller orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}