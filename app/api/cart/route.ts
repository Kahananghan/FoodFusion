import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Cart from '@/models/Cart'

// Workaround: some TypeScript setups infer a union type for Mongoose models
// which leads to "not callable" errors for `.find()`/`.findOne()` etc.
// Create a local any-typed alias for static method usage.
const CartModel: any = Cart
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId
    
  const cartItems = await CartModel.find({ userId }).sort({ createdAt: -1 })
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
    
    // Check if item already exists in cart
    const existingItem = await CartModel.findOne({ 
      name: body.name, 
      restaurant: body.restaurant,
      userId
    })
    
    if (existingItem) {
      // Update quantity if item exists
      existingItem.quantity += body.quantity || 1
      await existingItem.save()
      return NextResponse.json({ success: true, cartItem: existingItem })
    } else {
      // Create new item if doesn't exist
  const cartItem = new Cart({ ...body, userId })
  await cartItem.save()
      return NextResponse.json({ success: true, cartItem })
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to add item to cart' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    const { id, quantity } = await request.json()
  const cartItem = await CartModel.findByIdAndUpdate(id, { quantity }, { new: true })
    return NextResponse.json({ success: true, cartItem })
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
    
  await CartModel.findByIdAndDelete(id)
    return NextResponse.json({ success: true, message: 'Item removed from cart' })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to remove item from cart' }, { status: 500 })
  }
}