import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
const UserModel: any = User
import jwt from 'jsonwebtoken'
import { broadcast } from '@/lib/notificationServer'
// notifications are embedded in User model now

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
  const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId
      const user = await UserModel.findById(userId)
      if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
      const cartItems = (user.cart || []).slice().sort((a: any, b: any) => {
        return (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0)
      })
      return NextResponse.json({ success: true, cartItems })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch cart items' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
  const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId
    
  const body = await request.json()
    
    // Upsert item inside user's embedded cart array
  const user = await UserModel.findById(userId)
    if (!user) {
      console.error('[cart POST] user not found for id', userId)
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const existingIndex = (user.cart || []).findIndex((it: any) => it.name === body.name && it.restaurant === body.restaurant)
    if (existingIndex > -1) {
      // increment quantity
      user.cart[existingIndex].quantity = (user.cart[existingIndex].quantity || 0) + (body.quantity || 1)
      user.cart[existingIndex].updatedAt = new Date()
        try {
        await user.save()
        const cartItem = user.cart[existingIndex]
        // Broadcast notification to the user about cart update
        try {
          const payload = {
            id: cartItem._id?.toString?.() || Date.now().toString(),
            type: 'order',
            title: 'Cart Updated',
            message: `${cartItem.name} quantity updated to ${cartItem.quantity}`,
            timestamp: new Date(),
            actionUrl: `/cart`,
            targetUser: userId
          }
          try {
            // persist notification embedded in user
            user.notifications = user.notifications || []
            user.notifications.push({
              type: payload.type,
              title: payload.title,
              message: payload.message,
              actionUrl: payload.actionUrl
            } as any)
            await user.save()
          } catch (e) {
            console.warn('[cart POST] failed to persist notification on user', e)
          }
          broadcast('notification', payload)
        } catch (e) {
          console.warn('Failed to broadcast cart update', e)
        }
        return NextResponse.json({ success: true, cartItem })
      } catch (err) {
        console.error('[cart POST] failed saving incremented item', err)
        return NextResponse.json({ success: false, error: 'Failed to save cart item' }, { status: 500 })
      }
    } else {
      const newItem = {
        name: body.name,
        price: body.price,
        quantity: body.quantity,
        image: body.image || '',
        restaurant: body.restaurant,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      user.cart = user.cart || []
      user.cart.push(newItem)
      try {
        await user.save()
        const cartItem = user.cart[user.cart.length - 1]
        // Broadcast notification to the user about new cart item
        try {
          const payload = {
            id: cartItem._id?.toString?.() || Date.now().toString(),
            type: 'order',
            title: 'Added to Cart',
            message: `${cartItem.name} was added to your cart.`,
            timestamp: new Date(),
            actionUrl: `/cart`,
            targetUser: userId
          }
          try {
            user.notifications = user.notifications || []
            user.notifications.push({
              type: payload.type,
              title: payload.title,
              message: payload.message,
              actionUrl: payload.actionUrl
            } as any)
            await user.save()
            // return minimal notification payload to client (no DB id here)
            broadcast('notification', payload)
            return NextResponse.json({ success: true, cartItem, notification: payload })
          } catch (e) {
            console.warn('Failed to persist/broadcast cart add', e)
            return NextResponse.json({ success: true, cartItem })
          }
        } catch (e) {
          console.warn('Failed to broadcast cart add', e)
        }
      } catch (err) {
        console.error('[cart POST] failed saving new cart item', err)
        return NextResponse.json({ success: false, error: 'Failed to save cart item' }, { status: 500 })
      }
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to add item to cart' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    const { id, quantity } = await request.json()
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId
    const user = await UserModel.findById(userId)
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    const item = user.cart.id(id)
    if (!item) return NextResponse.json({ success: false, error: 'Cart item not found' }, { status: 404 })
    item.quantity = quantity
    item.updatedAt = new Date()
    await user.save()
    return NextResponse.json({ success: true, cartItem: item })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update cart item' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'Item ID required' }, { status: 400 })
    }
  const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
  const userId = decoded.userId
  // Use an atomic $pull to remove the cart subdocument by _id to avoid full-document save issues
  const updateRes = await UserModel.updateOne({ _id: userId }, { $pull: { cart: { _id: id } } })
    if (updateRes && (updateRes.modifiedCount === 1 || updateRes.nModified === 1 || updateRes.ok === 1)) {
      return NextResponse.json({ success: true, message: 'Item removed from cart' })
    }
    // If nothing was modified, the cart item didn't exist
  // no cart item removed (maybe not found) for id
    return NextResponse.json({ success: false, error: 'Cart item not found' }, { status: 404 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to remove item from cart' }, { status: 500 })
  }
}