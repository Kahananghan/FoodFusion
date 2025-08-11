import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import Restaurant from '@/models/Restaurant'
import Order from '@/models/Order'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Basic counts
    const totalUsers = await User.countDocuments()
    const totalRestaurants = await Restaurant.countDocuments({ status: 'approved' })
    const totalOrders = await Order.countDocuments()
    const pendingApprovals = await Restaurant.countDocuments({ status: 'pending' })
    const activeDeliveryPartners = await User.countDocuments({ role: 'delivery', status: 'available' })

    // Revenue calculations
    const revenueData = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' }, count: { $sum: 1 } } }
    ])
    
    const totalRevenue = revenueData[0]?.totalRevenue || 0
    const deliveredOrders = revenueData[0]?.count || 0
    const avgOrderValue = deliveredOrders > 0 ? Math.round(totalRevenue / deliveredOrders) : 0
    
    // Completion rate
    const completedOrders = await Order.countDocuments({ status: 'delivered' })
    const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0

    const stats = {
      totalUsers,
      totalRestaurants,
      totalOrders,
      pendingApprovals,
      activeDeliveryPartners,
      totalRevenue,
      avgOrderValue,
      completionRate
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}