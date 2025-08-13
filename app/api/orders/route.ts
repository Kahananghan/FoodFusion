import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Order from '@/models/Order'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId
    
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean()
    
    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ orders: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const body = await request.json()
    console.log('Received order data:', body)
    
    // Calculate subtotal from items
    const subtotal = (body.items || []).reduce((sum: number, item: any) => {
      return sum + ((item.menuItem?.price || 0) * (item.quantity || 1))
    }, 0)
    
    // Apply delivery fee logic: free above ₹500
    const deliveryFee = subtotal >= 500 ? 0 : 40
    const totalAmount = subtotal + deliveryFee
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId
    
    const orderData = {
      user: userId,
      restaurant: body.restaurant,
      items: body.items || [],
      totalAmount,
      deliveryAddress: body.deliveryAddress || {
        street: 'Default Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001'
      },
      status: body.status || 'confirmed',
      deliveryFee,
      estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000)
    }
    
    const order = new Order(orderData)
    const savedOrder = await order.save()
    console.log('Order saved:', savedOrder)
    
    return NextResponse.json({ order: savedOrder }, { status: 201 })
  } catch (error) {
    console.error('Order save error:', error)
    return NextResponse.json({ error: 'Failed to create order'}, { status: 500 })
  }
}