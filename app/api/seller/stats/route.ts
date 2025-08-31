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
    
  // @ts-ignore suppress mongoose typing overload complexity
  const restaurant = await Restaurant.findOne({ owner: decoded.userId })
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }
    // Orders may store restaurant as name OR id (string). Match both.
    const matchValues = [restaurant._id.toString(), restaurant.name]
  // @ts-ignore suppress mongoose typing overload complexity
  const orders = await Order.find({ restaurant: { $in: matchValues } })
  const computedTotalOrders = orders.length
  // Use delivered revenue for consistency with seller UI (delivered orders only)
  const computedDeliveredRevenue = orders.reduce((sum, order) => order.status === 'delivered' ? sum + order.totalAmount : sum, 0)
    const activeMenuItems = restaurant.menu.filter(item => item.isAvailable).length

    const stats = {
      // Prefer persisted values; fall back to computed if missing.
      totalOrders: typeof restaurant.totalOrders === 'number' ? restaurant.totalOrders : computedTotalOrders,
      totalRevenue: typeof restaurant.revenue === 'number' ? restaurant.revenue : computedDeliveredRevenue,
      activeMenuItems,
      avgRating: restaurant.rating || 4.5
    }
    // Only update if persisted values are behind (monotonic increase) to avoid overwriting newer updates elsewhere
    try {
      let changed = false
      if (restaurant.totalOrders < computedTotalOrders) { restaurant.totalOrders = computedTotalOrders; changed = true }
      if (restaurant.revenue < computedDeliveredRevenue) { restaurant.revenue = computedDeliveredRevenue; changed = true }
      if (changed) await restaurant.save()
    } catch (e) { console.warn('Non-fatal: seller stats monotonic sync failed', e) }

    return NextResponse.json({ stats })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}