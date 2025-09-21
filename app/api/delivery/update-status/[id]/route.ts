import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import Order from '@/models/Order'
import User from '@/models/User'
import { broadcast } from '@/lib/notificationServer'

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

  // cast to any to avoid Mongoose TypeScript overload conflicts in this runtime
  // @ts-ignore
  const order = await (Order as any).findById(params.id)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Only allow the assigned delivery person to update
    if (decoded.role === 'delivery' && order.deliveryPersonId?.toString() !== decoded.userId) {
      return NextResponse.json({ error: 'Not your order' }, { status: 403 })
    }

    order.status = status
    await order.save()

    // If order marked delivered, persist a notification for the order owner and broadcast
    if (status === 'delivered') {
      try {
        const userId = order.user && order.user.toString ? order.user.toString() : order.user
        if (userId) {
          // @ts-ignore
          const user = await (User as any).findById(userId)
          if (user) {
            user.notifications = user.notifications || []
            const payload: any = {
              id: order._id?.toString() || Date.now().toString(),
              type: 'order',
              title: 'Order Delivered',
              message: `Your order #${(order._id || '').toString().slice(-6)} has been delivered.`,
              timestamp: new Date(),
              actionUrl: '/orders',
              targetUser: userId
            }
            user.notifications.push({ type: payload.type, title: payload.title, message: payload.message, actionUrl: payload.actionUrl } as any)
            await user.save()
            // Broadcast to connected clients for this user
            try { broadcast('notification', payload) } catch (e) { /* ignore */ }
          }
        }
      } catch (e) {
        console.warn('[delivery PATCH] failed to persist/broadcast delivered notification', e)
      }
    }

    return NextResponse.json({ message: 'Order status updated', order })
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
  }
}
