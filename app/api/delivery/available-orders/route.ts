import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Order from '@/models/Order'
import Restaurant from '@/models/Restaurant'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
      const orders = await Order.find({ 
        status: { $in: ['ready'] },
        $or: [
          { deliveryPersonId: { $exists: false } },
          { deliveryPersonId: null },
          // Use $expr for literal string comparisons to avoid Mongoose casting to ObjectId
          { $expr: { $eq: ["$deliveryPersonId", ""] } },
          { $expr: { $eq: ["$deliveryPersonId", "null"] } }
        ]
      })
  .populate({ path: 'user', model: User, select: 'name phone addresses' })
      .sort({ createdAt: -1 })
      .limit(20)
    
    // Transform orders for delivery interface and populate restaurant details
    const transformedOrders = await Promise.all(orders.map(async order => {
      // Try to resolve restaurant document if order.restaurant stores an ObjectId string
      let restaurantDoc = null
      try {
        // If restaurant field is an id string, attempt to lookup Restaurant
        restaurantDoc = await (Restaurant as any).findById(order.restaurant).select('name').lean()
      } catch (e) {
        // ignore lookup errors — we'll fall back to raw value
      }

      return {
        _id: order._id,
        orderNumber: `ORD${order._id.toString().slice(-6).toUpperCase()}`,
        customer: {
          name: order.deliveryAddress?.name || order.user?.name || 'Customer',
          phone: order.deliveryAddress?.phone || order.user?.phone || 'N/A',
          address: (order.deliveryAddress?.street && order.deliveryAddress?.city) ? {
            street: order.deliveryAddress.street,
            city: order.deliveryAddress.city,
            state: order.deliveryAddress.state,
            zipCode: order.deliveryAddress.zipCode,
            landmark: order.deliveryAddress.landmark || ''
          } : (order.user?.addresses?.[0] ? {
            street: order.user.addresses[0].street,
            city: order.user.addresses[0].city,
            state: order.user.addresses[0].state,
            zipCode: order.user.addresses[0].zipCode,
            landmark: order.user.addresses[0].landmark || ''
          } : {
            street: '123 Main Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            zipCode: '400001',
            landmark: ''
          })
        },
        restaurant: {
          // Prefer looked up restaurant name/address; otherwise fall back to stored string
          name: restaurantDoc?.name || order.restaurant || 'Restaurant',
          address: restaurantDoc?.address || {
            street: '123 Restaurant St',
            city: 'Mumbai'
          }
        },
        items: order.items.map((item: any) => ({
          name: item.menuItem?.name || 'Item',
          quantity: item.quantity
        })),
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
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        distance: 2.5, // Mock distance
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }
    }))

    return NextResponse.json({ orders: transformedOrders })
  } catch (error) {
    console.error('Error fetching available orders:', error)
    return NextResponse.json({ error: 'Failed to fetch available orders' }, { status: 500 })
  }
}