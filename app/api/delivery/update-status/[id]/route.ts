import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import Order from '@/models/Order'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()

    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    // Only allow delivery person or admin to update status
    if (decoded.role !== 'delivery' && decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { status } = await request.json()
    // Only allow valid status transitions
    const allowedStatuses = ['picked-up', 'out-for-delivery', 'delivered']
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const order = await Order.findById(params.id)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Only allow the assigned delivery person to update
    if (decoded.role === 'delivery' && order.deliveryPersonId?.toString() !== decoded.userId) {
      return NextResponse.json({ error: 'Not your order' }, { status: 403 })
    }

    order.status = status
    await order.save()

    return NextResponse.json({ message: 'Order status updated', order })
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
  }
}
