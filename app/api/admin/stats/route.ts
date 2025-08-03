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

    const totalUsers = await User.countDocuments()
    const totalRestaurants = await Restaurant.countDocuments()
    const totalOrders = await Order.countDocuments()
    const pendingApprovals = await Restaurant.countDocuments({ status: 'pending' })

    const stats = {
      totalUsers,
      totalRestaurants,
      totalOrders,
      pendingApprovals
    }

    return NextResponse.json({ stats })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}