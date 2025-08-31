import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Order from '@/models/Order'
import Restaurant from '@/models/Restaurant'
import User from '@/models/User'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId
    
  // @ts-ignore mongoose dynamic model typing
  const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean()

    // Collect unique restaurant ids (filter valid ObjectIds)
  const restaurantIds: string[] = Array.from(new Set(orders.map((o: any) => o.restaurant).filter(Boolean))) as string[]
    let restaurantMap: Record<string,string> = {}
    if (restaurantIds.length) {
      try {
        // Some stored ids might be plain strings not valid ObjectIds, attempt both
  const validIds = restaurantIds.filter((id: string) => (id && (id as any).length >= 12)) // heuristic
  // @ts-ignore mongoose dynamic model typing
  const docs = await Restaurant.find({ _id: { $in: validIds } }).select('_id name').lean()
        restaurantMap = docs.reduce((acc: any, r: any) => { acc[r._id.toString()] = r.name; return acc }, {})
      } catch (e) {
        console.warn('Restaurant lookup failed', e)
      }
    }

    const enriched = orders.map(o => ({ ...o, restaurantName: restaurantMap[o.restaurant]}))
    return NextResponse.json({ orders: enriched })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ orders: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const body = await request.json()
    
    // Calculate subtotal from items
    const subtotal = (body.items || []).reduce((sum: number, item: any) => {
      return sum + ((item.menuItem?.price || 0) * (item.quantity || 1))
    }, 0)
    
    // Apply delivery fee logic: free above ₹500
    const deliveryFee = subtotal >= 500 ? 0 : 40
    const totalAmount = subtotal + deliveryFee
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId
    
  let deliveryAddress = body.deliveryAddress;
  // Debug: log type and value
  console.log('DEBUG deliveryAddress before save:', typeof deliveryAddress, deliveryAddress);
  // @ts-ignore mongoose dynamic model typing
  const user = await User.findById(userId);
    if (!deliveryAddress || typeof deliveryAddress === 'string') {
      let found: any = null;
      if (user && Array.isArray(user.addresses) && typeof deliveryAddress === 'string') {
        found = user.addresses.find((addr: any) => addr._id.toString() === deliveryAddress);
      }
      if (found && typeof found === 'object') {
        // Only keep schema fields
        const { name, phone, street, city, state, zipCode, landmark = '', type = 'home' } = found;
        deliveryAddress = { name, phone, street, city, state, zipCode, landmark, type };
      } else {
        // fallback default address
        deliveryAddress = {
          street: 'Default Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
          name: user?.name || 'Unknown',
          phone: user?.phone || '0000000000',
          type: 'home',
          landmark: ''
        };
      }
    } else if (typeof deliveryAddress === 'object') {
      // If frontend sends an address object, strip _id and any extra fields, and ensure all required fields are present
      const { name, phone, street, city, state, zipCode, landmark = '', type = 'home' } = deliveryAddress;
      if (!name || !phone || !street || !city || !state || !zipCode) {
        return NextResponse.json({ error: 'All address fields are required.' }, { status: 400 });
      }
      deliveryAddress = { name, phone, street, city, state, zipCode, landmark, type };
    } else {
      return NextResponse.json({ error: 'Invalid delivery address.' }, { status: 400 });
    }
    // If client supplies combinedTotalAmount (sum of all restaurant orders from one checkout) use it to determine free delivery waiver
    let combinedTotalAmount = body.combinedTotalAmount
    if (typeof combinedTotalAmount === 'number' && combinedTotalAmount >= 500) {
      // Waive delivery fee for this split order as overall cart qualified
      if (deliveryFee > 0) {
        console.log('Waiving delivery fee due to combinedTotalAmount >=500')
      }
    } else {
      combinedTotalAmount = undefined
    }

    const orderData = {
      user: userId,
      restaurant: body.restaurant,
      items: body.items || [],
      totalAmount,
      deliveryAddress,
      status: body.status || 'confirmed',
      deliveryFee: (combinedTotalAmount && combinedTotalAmount >= 500) ? 0 : deliveryFee,
      combinedTotalAmount,
      estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000)
    }
    const order = new Order(orderData)
    const savedOrder = await order.save()
    console.log('Order saved:', savedOrder)
    return NextResponse.json({ order: savedOrder }, { status: 201 })
  } catch (error) {
    console.error('Order save error:', error)
    return NextResponse.json({ error: 'Failed to create order'}, { status: 500 })
  }
}