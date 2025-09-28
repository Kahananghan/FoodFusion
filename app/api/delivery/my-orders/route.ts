import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import Order from '@/models/Order'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    // Find orders assigned to this delivery person
  // @ts-ignore suppress complex mongoose overload typing
  const orders = await Order.find({ deliveryPersonId: decoded.userId })
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
        } : {
          street: 'Address not available',
          city: '',
          state: '',
          zipCode: '',
          landmark: ''
        }
      },
      restaurant: {
        name: order.restaurant || 'Restaurant',
        address: {
          street: '123 Restaurant St',
          city: 'Mumbai'
        }
      },
      items: order.items.map((item: any)=> ({
        name: item.menuItem?.name || 'Item',
        quantity: item.quantity
      })),
      totalAmount: order.totalAmount,
      deliveryFee: order.deliveryFee || 40,
      combinedTotalAmount: order.combinedTotalAmount,
      freeDelivery: (order.deliveryFee === 0),
      freeDeliveryReason: (order.deliveryFee === 0) ? (
        (order.combinedTotalAmount && order.combinedTotalAmount >= 500 && order.totalAmount < 500 + (order.deliveryFee || 0))
          ? 'waived-via-combined-cart'
          : 'subtotal-threshold'
      ) : null,
      status: order.status,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }))

    return NextResponse.json({ orders: transformedOrders })
  } catch (error) {
    console.error('Error fetching my orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}