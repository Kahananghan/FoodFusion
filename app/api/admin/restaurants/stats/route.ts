import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import Order from '@/models/Order'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    if (decoded.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 })

    // Using case-insensitive match to align with stored string in orders
    const match = { restaurant: { $regex: new RegExp('^' + name + '$', 'i') } }
    const pipeline: any[] = [
      { $match: match },
      { $group: { _id: '$restaurant', orders: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } }
    ]
    const agg = await (Order as any).aggregate(pipeline)
    const stats = agg[0] || { orders: 0, revenue: 0 }
    return NextResponse.json({ stats: { totalOrders: stats.orders, revenue: stats.revenue } })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to compute stats' }, { status: 500 })
  }
}