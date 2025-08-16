
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Order from '@/models/Order'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Get all delivery partners
    const partners = await User.find({ role: 'delivery' })
      .select('name email phone status rating location')
      .sort({ createdAt: -1 })

    // For each partner, calculate totalDeliveries and earnings from Order collection
    const partnerData = await Promise.all(partners.map(async (partner) => {
      // Find delivered orders for this partner
      const deliveredOrders = await Order.find({ deliveryPersonId: partner._id, status: 'delivered' })
      const totalDeliveries = deliveredOrders.length
      const earnings = deliveredOrders.reduce((sum, order) => sum + Math.round(order.totalAmount * 0.3), 0)
      return {
        _id: partner._id,
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        status: partner.status,
        rating: partner.rating,
        location: partner.location,
        totalDeliveries,
        earnings
      }
    }))

    return NextResponse.json({ partners: partnerData })
  } catch (error) {
    console.error('Error fetching delivery partners:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}