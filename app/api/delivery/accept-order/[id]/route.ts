import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import Order from '@/models/Order'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    // Assign the order to this delivery person and update status
    const order = await Order.findByIdAndUpdate(
      params.id,
      { 
        deliveryPersonId: decoded.userId,
        status: 'out-for-delivery'
      },
      { new: true }
    )
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Order accepted successfully', order })
  } catch (error) {
    console.error('Error accepting order:', error)
    return NextResponse.json({ error: 'Failed to accept order' }, { status: 500 })
  }
}