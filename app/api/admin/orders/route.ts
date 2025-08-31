import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'
import Restaurant from '@/models/Restaurant'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
  // @ts-ignore suppress mongoose typing overload complexity
  const orders = await Order.find({})
      .populate('user', 'name email')
      .populate('deliveryPersonId', 'name')
      .sort({ createdAt: -1 })
      .limit(100)

    // Get all restaurants to create a mapping
  // @ts-ignore suppress mongoose typing overload complexity
  const restaurants = await Restaurant.find({}, 'name')
    const restaurantNames = restaurants.map(r => r.name)
    
    // Transform orders to match admin interface expectations
    const transformedOrders = orders.map(order => {
      // Use the stored restaurant name from the order
      // If it's one of the old default names or empty, use the first available restaurant name
      let restaurantName = order.restaurant
      
      if (!restaurantName || restaurantName === 'My Restaurant' || restaurantName === 'Unknown Restaurant') {
        restaurantName = restaurantNames.length > 0 ? restaurantNames[0] : 'Unknown Restaurant'
      }
      
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
        deliveryFee: order.deliveryFee,
        combinedTotalAmount: order.combinedTotalAmount,
        freeDelivery: (order.deliveryFee === 0) ? true : false,
        freeDeliveryReason: (order.deliveryFee === 0) ? (
          (order.combinedTotalAmount && order.combinedTotalAmount >= 500 && order.totalAmount < 500 + (order.deliveryFee || 0))
            ? 'waived-via-combined-cart'
            : 'subtotal-threshold'
        ) : null,
        createdAt: order.createdAt,
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