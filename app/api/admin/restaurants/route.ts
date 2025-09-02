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
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

  const Model: any = Restaurant
  const restaurants = await Model.find()
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })

    // Build match set of all restaurant names and ids (string) to aggregate orders in one pass
    const nameSet = new Set<string>()
    const idSet = new Set<string>()
    restaurants.forEach((r: any) => { if (r.name) nameSet.add(r.name); if (r._id) idSet.add(r._id.toString()) })
    // Build match values: include string ids directly and case-insensitive regex for each name
    const matchValues = [
      ...Array.from(idSet),
      ...Array.from(nameSet).map(n => new RegExp('^' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'))
    ]

    // Aggregate orders by their stored restaurant string referencing either name or id
  let orderAgg: Record<string, any> = {}
    if (matchValues.length) {
      try {
        // @ts-ignore suppress typing complexity
        const pipeline = [
          { $match: { restaurant: { $in: matchValues } } },
          { $group: { _id: '$restaurant', totalOrders: { $sum: 1 }, revenueAll: { $sum: '$totalAmount' }, deliveredRevenue: { $sum: { $cond: [{ $eq: ['$status','delivered'] }, '$totalAmount', 0] } } } }
        ]
        // @ts-ignore
        const agg = await Order.aggregate(pipeline)
  orderAgg = agg.reduce((acc: any, row: any) => { acc[row._id] = { totalOrders: row.totalOrders, deliveredRevenue: row.deliveredRevenue, revenueAll: row.revenueAll }; return acc }, {})
  // Ensure every key has revenueAll field
  Object.keys(orderAgg).forEach(k => { const entry: any = orderAgg[k]; if (typeof entry.revenueAll !== 'number') entry.revenueAll = entry.deliveredRevenue })
      } catch (e) {
        console.warn('Admin restaurants aggregation failed', e)
      }
    }

    const mapped = await Promise.all(restaurants.map(async (r: any) => {
      const idKey = r._id.toString()
      const nameKey = r.name
  const idStats = (orderAgg[idKey] as any) || { totalOrders: 0, deliveredRevenue: 0, revenueAll: 0 }
  const nameStats = (orderAgg[nameKey] as any) || { totalOrders: 0, deliveredRevenue: 0, revenueAll: 0 }
      // Combine in case some orders stored by id and some by name
      const combinedOrders = idStats.totalOrders + nameStats.totalOrders
  const combinedDeliveredRevenue = idStats.deliveredRevenue + nameStats.deliveredRevenue
  const combinedRevenueAll = idStats.revenueAll + nameStats.revenueAll

      let totalOrders = typeof r.totalOrders === 'number' ? r.totalOrders : 0
      let revenue = typeof r.revenue === 'number' ? r.revenue : 0

      // Persist accurate aggregates: totalOrders (non-cancelled) and revenue (delivered-only)
      // Use combinedDeliveredRevenue for revenue (do not count non-delivered/cancelled orders)
      if (combinedOrders !== totalOrders || combinedDeliveredRevenue !== revenue) {
        totalOrders = combinedOrders
        revenue = combinedDeliveredRevenue
        try {
          r.totalOrders = totalOrders
          r.revenue = revenue
          await r.save()
        } catch (e) {
          console.warn('Failed to persist combined restaurant stats', r._id.toString(), e)
        }
      }

  return {
        _id: r._id,
        name: r.name,
        description: r.description,
        image: r.image,
        cuisine: r.cuisine,
        deliveryTime: r.deliveryTime,
        deliveryFee: r.deliveryFee,
        minimumOrder: r.minimumOrder,
        isOpen: r.isOpen,
        status: r.status,
        createdAt: r.createdAt,
        owner: r.owner,
  totalOrders,
  revenue, // delivered-only revenue (backend aggregated)
  deliveredRevenue: combinedDeliveredRevenue,
        averageRating: r.averageRating || 0,
        totalReviews: r.totalReviews || 0,
        address: r.address
      }
    }))

    return NextResponse.json({ restaurants: mapped })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch restaurants' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await dbConnect()
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    if (decoded.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, cuisine } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const update: any = {}
    if (typeof cuisine === 'string') {
      const arr = cuisine.split(',').map((c: string) => c.trim()).filter(Boolean)
      if (arr.length) update.cuisine = arr
    }
    if (!Object.keys(update).length) return NextResponse.json({ error: 'No valid fields' }, { status: 400 })

  const Model: any = Restaurant
  const restaurant = await Model.findByIdAndUpdate(id, update, { new: true })
      .populate('owner', 'name email')
    if (!restaurant) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ restaurant })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update restaurant' }, { status: 500 })
  }
}