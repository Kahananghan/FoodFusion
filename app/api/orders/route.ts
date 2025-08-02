import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Order from '@/models/Order'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    let query: any = {}
    if (userId) {
      query.user = userId
    }
    
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('restaurant', 'name image')
      .sort({ createdAt: -1 })
    
    return NextResponse.json({ orders })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const body = await request.json()
    const order = new Order({
      ...body,
      estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000) // 45 minutes from now
    })
    await order.save()
    
    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}