import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import Restaurant from '@/models/Restaurant'

// Helper to extract user id from token
async function getUserId(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  if (!token) return null
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not configured')
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any
    return decoded.userId
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  const restaurant = await (Restaurant as any).findOne({ owner: userId })
    if (!restaurant) {
      return NextResponse.json({ restaurant: null }, { status: 200 })
    }
    return NextResponse.json({ restaurant })
  } catch (error) {
    console.error('Restaurant fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch restaurant' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      image,
      cuisine,
      deliveryTime,
      deliveryFee,
      minimumOrder,
      address,
      isOpen
    } = body

    if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
    if (!description?.trim()) return NextResponse.json({ error: 'Description required' }, { status: 400 })
    if (!image?.trim()) return NextResponse.json({ error: 'Image URL required' }, { status: 400 })
    if (!Array.isArray(cuisine) || cuisine.length === 0) return NextResponse.json({ error: 'At least one cuisine required' }, { status: 400 })
    if (!deliveryTime?.trim()) return NextResponse.json({ error: 'Delivery time required' }, { status: 400 })
    if (deliveryFee == null) return NextResponse.json({ error: 'Delivery fee required' }, { status: 400 })
    if (minimumOrder == null) return NextResponse.json({ error: 'Minimum order required' }, { status: 400 })
    if (!address || !address.street || !address.city || !address.state || !address.zipCode) {
      return NextResponse.json({ error: 'Complete address required' }, { status: 400 })
    }

  const existingRestaurant = await (Restaurant as any).findOne({ owner: userId })
    if (existingRestaurant) {
      return NextResponse.json({ error: 'Restaurant already exists for this user' }, { status: 400 })
    }

    const restaurant = new Restaurant({
      name: name.trim(),
      description: description.trim(),
      image: image.trim(),
      cuisine: cuisine.map((c: string) => c.trim()).filter(Boolean),
      deliveryTime: deliveryTime.trim(),
      deliveryFee,
      minimumOrder,
      address: {
        street: address.street.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        zipCode: address.zipCode.trim(),
        coordinates: address.coordinates || undefined
      },
      owner: userId,
      isOpen: isOpen !== undefined ? isOpen : true,
      status: 'approved'
    })

    const savedRestaurant = await restaurant.save()
    return NextResponse.json({ message: 'Restaurant created successfully', restaurant: savedRestaurant }, { status: 201 })
  } catch (error) {
    console.error('Restaurant creation error:', error)
    return NextResponse.json({ error: 'Failed to create restaurant' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect()
    const userId = await getUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const update: any = {}
    const fields = ['name','description','image','deliveryTime','deliveryFee','minimumOrder','isOpen']
    for (const f of fields) {
      if (body[f] !== undefined) update[f] = body[f]
    }
    if (body.cuisine) {
      if (!Array.isArray(body.cuisine) || body.cuisine.length === 0) {
        return NextResponse.json({ error: 'Cuisine must be a non-empty array' }, { status: 400 })
      }
      update.cuisine = body.cuisine.map((c: string) => c.trim()).filter(Boolean)
    }
    if (body.address) {
      const addr = body.address
      const requiredAddr = ['street','city','state','zipCode']
      for (const k of requiredAddr) {
        if (!addr[k]) return NextResponse.json({ error: `Address field ${k} required` }, { status: 400 })
      }
      update.address = {
        street: addr.street.trim(),
        city: addr.city.trim(),
        state: addr.state.trim(),
        zipCode: addr.zipCode.trim(),
        coordinates: addr.coordinates || undefined
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

  const restaurant = await (Restaurant as any).findOneAndUpdate({ owner: userId }, update, { new: true })
    if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    return NextResponse.json({ message: 'Restaurant updated successfully', restaurant })
  } catch (error) {
    console.error('Restaurant update error:', error)
    return NextResponse.json({ error: 'Failed to update restaurant' }, { status: 500 })
  }
}