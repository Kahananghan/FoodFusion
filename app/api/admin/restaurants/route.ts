import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import Restaurant from '@/models/Restaurant'

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

    return NextResponse.json({ restaurants })
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