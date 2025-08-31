import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import Order from '@/models/Order'
import Restaurant from '@/models/Restaurant'

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

    // Find the restaurant document by name (case-insensitive) to obtain its id
    const restaurantDoc = await (Restaurant as any).findOne({ name: { $regex: new RegExp('^' + name + '$', 'i') } }).select('_id name')
    let keys: string[] = [name]
    if (restaurantDoc) keys = Array.from(new Set([restaurantDoc.name, restaurantDoc._id.toString()]))
    const pipeline: any[] = [
      { $match: { restaurant: { $in: keys } } },
      { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } }
    ]
    const agg = await (Order as any).aggregate(pipeline)
    const stats = agg[0] || { orders: 0, revenue: 0 }
    return NextResponse.json({ stats: { totalOrders: stats.orders || 0, revenue: stats.revenue || 0 } })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to compute stats' }, { status: 500 })
  }
}