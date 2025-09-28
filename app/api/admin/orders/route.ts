import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'
import Restaurant from '@/models/Restaurant'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
  // @ts-ignore suppress mongoose typing overload complexity
  const orders = await Order.find({})
    .populate('user', 'name email')
    .populate('deliveryPersonId', 'name')
    .sort({ createdAt: -1 })
    .limit(100)

  // Get all restaurants to create a mapping of id to name
  // @ts-ignore suppress mongoose typing overload complexity
  const restaurants = await Restaurant.find({}, 'name _id')
  const restaurantMap = restaurants.reduce((acc: any, r: any) => {
    acc[r._id.toString()] = r.name
    return acc
  }, {})

  // Transform orders to match admin interface expectations
  const transformedOrders = orders.map(order => {
    // Use the restaurant name from the mapping if possible
    let restaurantName = restaurantMap[order.restaurant]
    if (!restaurantName) {
      restaurantName = typeof order.restaurant === 'string' ? order.restaurant : 'Unknown Restaurant'
    }

    // Map items with minimal safe shape
    let items: any[] = []
    try {
      items = (order.items || []).map((it: any) => ({
        name: it.menuItem?.name || 'Item',
        price: Number(it.menuItem?.price) || 0,
        image: it.menuItem?.image || null,
        quantity: it.quantity || 1,
        total: ((Number(it.menuItem?.price) || 0) * (it.quantity || 1))
      }))
    } catch {}

    const subtotal = items.reduce((s, i) => s + i.total, 0)

    return {
      _id: order._id,
      orderNumber: `ORD${order._id.toString().slice(-6).toUpperCase()}`,
      customer: {
        name: order.user?.name || 'Unknown',
        email: order.user?.email || 'Unknown'
      },
      restaurant: {
        name: restaurantName
      },
      status: order.status,
      total: order.totalAmount,
      subtotal,
      deliveryFee: order.deliveryFee,
      combinedTotalAmount: order.combinedTotalAmount,
      freeDelivery: (order.deliveryFee === 0) ? true : false,
      freeDeliveryReason: (order.deliveryFee === 0) ? (
        (order.combinedTotalAmount && order.combinedTotalAmount >= 500 && order.totalAmount < 500 + (order.deliveryFee || 0))
          ? 'waived-via-combined-cart'
          : 'subtotal-threshold'
      ) : null,
      createdAt: order.createdAt,
      items,
      deliveryAddress: order.deliveryAddress ? {
        name: order.deliveryAddress.name,
        phone: order.deliveryAddress.phone,
        street: order.deliveryAddress.street,
        city: order.deliveryAddress.city,
        state: order.deliveryAddress.state,
        zipCode: order.deliveryAddress.zipCode,
        landmark: order.deliveryAddress.landmark || '',
        type: order.deliveryAddress.type || 'home'
      } : null,
      deliveryPartner: order.deliveryPersonId ? {
        name: order.deliveryPersonId.name
      } : null
      }
    })

    return NextResponse.json({ orders: transformedOrders })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}