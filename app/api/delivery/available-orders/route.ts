import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Order from '@/models/Order'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    // Find orders that are ready for delivery (status: 'ready') and not assigned to any delivery person
    const orders = await Order.find({ 
      status: 'ready',
      deliveryPersonId: { $exists: false }
    })
      .populate('user', 'name phone addresses')
      .sort({ createdAt: -1 })
      .limit(20)
    
    // Transform orders for delivery interface
    const transformedOrders = orders.map(order => ({
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
        name: order.restaurant || 'Restaurant',
        address: {
          street: '123 Restaurant St',
          city: 'Mumbai'
        }
      },
      items: order.items.map(item => ({
        name: item.menuItem?.name || 'Item',
        quantity: item.quantity
      })),
      totalAmount: order.totalAmount,
      deliveryFee: order.deliveryFee,
      status: order.status,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      distance: 2.5, // Mock distance
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }))

    return NextResponse.json({ orders: transformedOrders })
  } catch (error) {
    console.error('Error fetching available orders:', error)
    return NextResponse.json({ error: 'Failed to fetch available orders' }, { status: 500 })
  }
}