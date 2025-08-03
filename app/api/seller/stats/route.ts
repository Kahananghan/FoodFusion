import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
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
    
    const restaurant = await Restaurant.findOne({ owner: decoded.userId })
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    const orders = await Order.find({ restaurant: restaurant._id })
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0)
    const activeMenuItems = restaurant.menu.filter(item => item.isAvailable).length

    const stats = {
      totalOrders,
      totalRevenue,
      activeMenuItems,
      avgRating: restaurant.rating || 4.5
    }

    return NextResponse.json({ stats })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}