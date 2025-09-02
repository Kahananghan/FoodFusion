import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Order from '@/models/Order'
import Restaurant from '@/models/Restaurant'
import mongoose from 'mongoose'
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

  // Ensure each item has menuItem.image in the response
  const enriched = orders.map(o => ({
    ...o,
    restaurantName: restaurantMap[o.restaurant],
    items: (o.items || []).map((item: any) => ({
      ...item,
      menuItem: {
        ...item.menuItem,
        image: item.menuItem?.image || ''
      }
    }))
  }))
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

    // Resolve restaurant by id or name; normalize to id for storage going forward
    let restaurantDoc: any = null
    let restaurantRef: string | undefined = body.restaurant
    if (restaurantRef) {
      try {
        const isValidId = typeof restaurantRef === 'string' && mongoose.Types.ObjectId.isValid(restaurantRef)
        if (isValidId) {
          // @ts-ignore overload typing noise
          restaurantDoc = await (Restaurant as any).findById(restaurantRef).select('deliveryFee')
        }
        if (!restaurantDoc) {
          // Try by name (case-insensitive)
            const escaped = restaurantRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          // @ts-ignore overload typing noise
          restaurantDoc = await (Restaurant as any).findOne({ name: { $regex: new RegExp('^' + escaped + '$', 'i') } }).select('deliveryFee name')
        }
        if (restaurantDoc?._id) {
          restaurantRef = restaurantDoc._id.toString()
        }
      } catch (e) {
        console.warn('Restaurant resolution failed', e)
      }
    }

    const baseDeliveryFee = typeof restaurantDoc?.deliveryFee === 'number' ? restaurantDoc.deliveryFee : 40
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId
    
  let deliveryAddress = body.deliveryAddress;
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
    const qualifiesByCombined = typeof combinedTotalAmount === 'number' && combinedTotalAmount >= 500
    if (!qualifiesByCombined) {
      combinedTotalAmount = undefined
    }

    const qualifiesBySubtotal = subtotal >= 500
    // For orders below ₹500, use a flat delivery fee of ₹40 (do not use restaurant-configured lower/higher fees)
    let finalDeliveryFee: number
    if (qualifiesBySubtotal || qualifiesByCombined) {
      finalDeliveryFee = 0
    } else {
      finalDeliveryFee = 40
    }
    if (finalDeliveryFee === 0 && baseDeliveryFee > 0) {
      // delivery fee waived; no log required in production
    }

    const totalAmount = subtotal + finalDeliveryFee

    const orderData = {
      user: userId,
      restaurant: restaurantRef,
      items: body.items || [],
      totalAmount,
      deliveryAddress,
      status: body.status || 'confirmed',
      deliveryFee: finalDeliveryFee,
      combinedTotalAmount,
      estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000)
    }
    const order = new Order(orderData)
  const savedOrder = await order.save()
  
  if (restaurantDoc?._id) {
  try {
  const incObj: any = {}
  if (savedOrder.status !== 'cancelled') incObj.totalOrders = 1
  if (savedOrder.status === 'delivered') incObj.revenue = savedOrder.totalAmount
  if (Object.keys(incObj).length > 0) {
    await (Restaurant as any).updateOne({ _id: restaurantDoc._id }, { $inc: incObj })
  }
      } catch (e) {
        console.warn('Failed to increment restaurant aggregates on order create', e)
      }
    }
    try {
  const orderedItems = savedOrder.items || body.items || []
      if (user && Array.isArray(user.cart)) {
  // current user.cart snapshot suppressed in logs
        let modified = false
        for (const oi of orderedItems) {
          // Prefer removing by original cart item id if available
          const cartItemId = oi.cartItemId || oi.cartItem || oi._id
          const qtyOrdered = Number(oi.quantity || 1)
          if (cartItemId) {
            const itemDoc: any = user.cart.id ? user.cart.id(cartItemId) : null
            if (itemDoc) {
              if ((itemDoc.quantity || 0) > qtyOrdered) {
                itemDoc.quantity = (itemDoc.quantity || 0) - qtyOrdered
                itemDoc.updatedAt = new Date()
              } else {
                itemDoc.remove()
              }
              modified = true
              continue
            } else {
              // cartItemId provided but not found on user.cart
            }
          }

          // Fallback: match by name + restaurant
          const menu = oi.menuItem || {}
          const itemName = menu.name || oi.name
          const itemQty = qtyOrdered
          const itemRestaurant = savedOrder.restaurant || oi.restaurant || body.restaurant
          if (!itemName) continue
          const idx = user.cart.findIndex((ci: any) => ci && ci.name === itemName && ci.restaurant === itemRestaurant)
          if (idx === -1) {
            // fallback match not found for name
            continue
          }
          const cartItem = user.cart[idx]
          if (cartItem.quantity > itemQty) {
            cartItem.quantity = cartItem.quantity - itemQty
            cartItem.updatedAt = new Date()
            modified = true
          } else {
            user.cart.splice(idx, 1)
            modified = true
          }
        }
        if (modified) {
          user.markModified && user.markModified('cart')
          try {
            await user.save()
          } catch (e) {
            console.warn('[orders POST] Failed to save user after clearing cart items', e)
          }
        } else {
          // No matching items found in user cart to clear
        }
      }
    } catch (e) {
      console.warn('[orders POST] Error while clearing ordered items from cart', e)
    }

    return NextResponse.json({ order: savedOrder }, { status: 201 })
  } catch (error) {
    console.error('Order save error:', error)
    return NextResponse.json({ error: 'Failed to create order'}, { status: 500 })
  }
}